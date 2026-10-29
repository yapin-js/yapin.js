import { Collection } from '../util/Collection.js';
import { ErrorCodes, YapinError } from '../errors/index.js';
import { resolveId } from '../util/util.js';
import { handOutVoiceKey, webcrypto } from './e2ee.js';
import { VoiceConnection } from './VoiceConnection.js';

/**
 * `client.voice`: the bot's voice calls, one per server. Needs `npm i @livekit/rtc-node`
 * (loaded when first used, or pass it as `new Client({ voice: { rtc } })`).
 */
export class ClientVoiceManager {
  constructor(client) {
    Object.defineProperty(this, 'client', { value: client });
    /** server id → VoiceConnection */
    this.connections = new Collection();
    this._rtc = null;
  }

  async rtc() {
    if (this._rtc) return this._rtc;
    if (this.client.options.voice?.rtc) return (this._rtc = this.client.options.voice.rtc);
    try {
      this._rtc = await import('@livekit/rtc-node');
      return this._rtc;
    } catch (cause) {
      throw new YapinError(ErrorCodes.VoiceUnavailable, 'Voice needs LiveKit: run `npm i @livekit/rtc-node`', { cause });
    }
  }

  /**
   * Joins a voice channel and returns a VoiceConnection to play into. Joining another channel in
   * the same server moves the bot (Yapin’ allows one per server).
   * Options: sampleRate (48000), channels (2), bitrate (128000), rtc (the LiveKit module).
   */
  async connect(server, channel, { rtc: rtcOption, sampleRate = 48_000, channels = 2, bitrate = 128_000 } = {}) {
    const serverId = resolveId(server);
    const channelId = resolveId(channel);
    const rtc = rtcOption ?? (await this.rtc());
    const existing = this.connections.get(serverId);
    if (existing && existing.channelId === channelId && !existing.destroyed) return existing;
    if (existing) await existing.leave().catch(() => {});

    const ticket = await this.client.servers._ensure(serverId).voice.join(channelId);
    const crypto = await webcrypto();
    const mediaKey = ticket.e2ee ? crypto.getRandomValues(new Uint8Array(32)) : null;
    const room = new rtc.Room();
    // Shared-key mode encrypts our frames with mediaKey; HKDF (1) is how the app's browsers derive the frame key.
    // Deprecated `e2ee` on purpose, not `encryption`: `encryption` also encrypts data packets, which would seal the
    // key handoff below under the very key nobody has yet (track glows, no sound). Keep this until the app can read it.
    await room.connect(ticket.url, ticket.token, {
      autoSubscribe: false,
      dynacast: false,
      ...(mediaKey ? { e2ee: { keyProviderOptions: { sharedKey: mediaKey, ratchetWindowSize: 0, keyRingSize: 16, keyDerivationFunction: 1 } } } : {}),
    });
    const keys = mediaKey ? await handOutVoiceKey(room, mediaKey, { logger: this.client.logger }) : null;
    // Without this, a call nobody can decrypt looks exactly like a working one from here.
    room.on?.('encryptionError', (error) => {
      this.client.logger?.error?.(`voice: encryption error in ${channelId}: ${error?.message ?? error}`);
    });
    const source = new rtc.AudioSource(sampleRate, channels);
    const track = rtc.LocalAudioTrack.createAudioTrack('audio', source);
    const publishOptions = new rtc.TrackPublishOptions({
      source: rtc.TrackSource.SOURCE_MICROPHONE,
      dtx: false,
      audioEncoding: { maxBitrate: BigInt(bitrate) },
    });
    await room.localParticipant.publishTrack(track, publishOptions);

    const connection = new VoiceConnection(this, { rtc, room, source, track, ticket, keys, serverId, channelId, sampleRate, channels });
    room.on?.('disconnected', () => connection._remoteDisconnect());
    this.connections.set(serverId, connection);
    return connection;
  }

  async leave(server) {
    const serverId = resolveId(server);
    const connection = this.connections.get(serverId);
    if (connection) return connection.leave();
    return this.client.servers._ensure(serverId).voice.leave();
  }

  async destroy() {
    await Promise.allSettled([...this.connections.values()].map((c) => c.leave()));
  }
}
