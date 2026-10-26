import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handOutVoiceKey, webcrypto } from '../src/voice/e2ee.js';

// Stands in for a LiveKit room: chainable on/off, and a publishData that can be told to fail
// the way it does when the data channel isn't open yet.
function fakeRoom({ failures = 0 } = {}) {
  const handlers = new Map();
  const sends = [];
  let failing = failures;
  const room = {
    remoteParticipants: new Map(),
    localParticipant: {
      identity: 'bot',
      attributes: {},
      async setAttributes(attributes) {
        room.localParticipant.attributes = attributes;
      },
      async publishData(payload, options) {
        if (failing > 0) {
          failing--;
          throw new Error('data channel is not open');
        }
        sends.push({ payload, options });
      },
    },
    on(event, handler) {
      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
      return room;
    },
    off(event, handler) {
      handlers.set(event, (handlers.get(event) ?? []).filter((listener) => listener !== handler));
      return room;
    },
    emit(event, ...args) {
      for (const handler of handlers.get(event) ?? []) handler(...args);
    },
  };
  return { room, sends };
}

// The bot only seals its key for people who published a P-256 public key of their own.
async function listener(identity) {
  const crypto = await webcrypto();
  const pair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey']);
  const raw = await crypto.subtle.exportKey('raw', pair.publicKey);
  return { identity, attributes: { e2ee: btoa(String.fromCharCode(...new Uint8Array(raw))) } };
}

const mediaKey = () => new Uint8Array(32).fill(7);
const settle = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('someone already in the call still gets the media key when the first send fails', async () => {
  const { room, sends } = fakeRoom({ failures: 1 });
  room.remoteParticipants.set('alice', await listener('alice'));

  const keys = await handOutVoiceKey(room, mediaKey(), { retryDelays: [50, 150] });
  await settle(300);
  keys.stop();

  assert.equal(sends.length, 1, 'the dropped send should have been swept up again');
  assert.deepEqual(sends[0].options.destination_identities, ['alice']);
  assert.equal(sends[0].options.topic, 'yapper-e2ee');
});

test('a key that got through is not handed out twice by a later sweep', async () => {
  const { room, sends } = fakeRoom();
  room.remoteParticipants.set('alice', await listener('alice'));

  const keys = await handOutVoiceKey(room, mediaKey(), { retryDelays: [50, 150] });
  await settle(300);
  keys.stop();

  assert.equal(sends.length, 1);
});

test('someone who rejoins is handed the media key again', async () => {
  const { room, sends } = fakeRoom();
  const alice = await listener('alice');
  room.remoteParticipants.set('alice', alice);

  const keys = await handOutVoiceKey(room, mediaKey(), { retryDelays: [] });
  await settle(50);
  assert.equal(sends.length, 1);

  room.emit('participantDisconnected', alice);
  room.emit('participantConnected', alice);
  await settle(50);
  keys.stop();

  assert.equal(sends.length, 2, 'rejoining with the same key should not be skipped');
});

test('stopping the handoff cancels the pending sweeps', async () => {
  const { room, sends } = fakeRoom({ failures: 1 });
  room.remoteParticipants.set('alice', await listener('alice'));

  const keys = await handOutVoiceKey(room, mediaKey(), { retryDelays: [50] });
  keys.stop();
  await settle(200);

  assert.equal(sends.length, 0, 'nothing should go out after stop()');
});

test('a failed send is reported to the logger instead of being swallowed', async () => {
  const { room } = fakeRoom({ failures: 1 });
  room.remoteParticipants.set('alice', await listener('alice'));
  const debug = [];

  const keys = await handOutVoiceKey(room, mediaKey(), {
    retryDelays: [],
    logger: { debug: (message) => debug.push(message) },
  });
  await settle(50);
  keys.stop();

  assert.equal(debug.length, 1);
  assert.match(debug[0], /alice/);
});
