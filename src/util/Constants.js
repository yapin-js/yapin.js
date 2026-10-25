export const version = '0.1.1';

export const DefaultBaseURL = 'https://www.yapin.gg/api/bot/v1';
export const DefaultGatewayURL = 'wss://rt.yapper.website/bot';
export const DefaultWebhookBaseURL = 'https://www.yapin.gg/api/webhooks';
export const SiteURL = 'https://www.yapin.gg';
export const FilesURL = 'https://files.yapper.website';

/** Events emitted by the Client. */
export const Events = Object.freeze({
  ClientReady: 'ready',
  MessageCreate: 'messageCreate',
  ServerMemberAdd: 'serverMemberAdd',
  ServerMemberRemove: 'serverMemberRemove',
  MessageReactionAdd: 'messageReactionAdd',
  MessageReactionRemove: 'messageReactionRemove',
  InteractionCreate: 'interactionCreate',
  VoiceJoin: 'voiceJoin',
  VoiceLeave: 'voiceLeave',
  Test: 'test',
  CommandRun: 'commandRun',
  CommandSuccess: 'commandSuccess',
  CommandError: 'commandError',
  CommandDenied: 'commandDenied',
  CommandsSynced: 'commandsSynced',
  ModuleLoad: 'moduleLoad',
  ModuleUnload: 'moduleUnload',
  Connected: 'connected',
  Disconnected: 'disconnected',
  RateLimited: 'rateLimited',
  Raw: 'raw',
  Error: 'error',
  Warn: 'warn',
  Debug: 'debug',
});

/** Event types as Yapin’ sends them (GET /events, the gateway and event webhooks). */
export const GatewayEventTypes = Object.freeze({
  Message: 'message',
  MemberJoin: 'member_join',
  MemberLeave: 'member_leave',
  ReactionAdd: 'reaction_add',
  ReactionRemove: 'reaction_remove',
  Interaction: 'interaction',
  VoiceJoin: 'voice_join',
  VoiceLeave: 'voice_leave',
  Test: 'test',
});

/**
 * Which event types the bot wants. Over the gateway the filter is applied by Yapin’ (less traffic);
 * when polling it is applied locally. Groups are arrays, so `intents: [Intents.Messages, Intents.Members]` works.
 */
export const Intents = Object.freeze({
  Messages: 'message',
  Interactions: 'interaction',
  MemberJoin: 'member_join',
  MemberLeave: 'member_leave',
  Members: Object.freeze(['member_join', 'member_leave']),
  ReactionAdd: 'reaction_add',
  ReactionRemove: 'reaction_remove',
  Reactions: Object.freeze(['reaction_add', 'reaction_remove']),
  VoiceJoin: 'voice_join',
  VoiceLeave: 'voice_leave',
  Voice: Object.freeze(['voice_join', 'voice_leave']),
  Test: 'test',
  All: Object.freeze(['message', 'interaction', 'member_join', 'member_leave', 'reaction_add', 'reaction_remove', 'voice_join', 'voice_leave', 'test']),
});

export const ChannelType = Object.freeze({
  Text: 'text',
  Voice: 'voice',
  DM: 'dm',
  Category: 'category',
});

export const ButtonStyle = Object.freeze({
  Primary: 'primary',
  Secondary: 'secondary',
  Success: 'success',
  Danger: 'danger',
  Link: 'link',
});

/** Components V2 type numbers (the standard ones). */
// The builders send rows and buttons as 'row' / 'button', like the official SDK. ActionRow and
// Button are the standard numbers, so a layout pasted from elsewhere still reads as a button row.
export const ComponentType = Object.freeze({
  ActionRow: 1,
  Button: 2,
  Section: 9,
  TextDisplay: 10,
  Thumbnail: 11,
  MediaGallery: 12,
  File: 13,
  Separator: 14,
  Container: 17,
});

export const SeparatorSpacingSize = Object.freeze({
  Small: 1,
  Large: 2,
});

export const MessageFlags = Object.freeze({
  /** Components V2: `components` is the whole message, no content or embeds. */
  IsComponentsV2: 1 << 15,
});

export const InteractionType = Object.freeze({
  Button: 'button',
});

export const InteractionResponseType = Object.freeze({
  Reply: 'reply',
  Ephemeral: 'ephemeral',
  Update: 'update',
  Ack: 'ack',
});

export const PresenceStatus = Object.freeze({
  Online: 'online',
  Idle: 'idle',
  DoNotDisturb: 'dnd',
});

/**
 * Permission names as Yapin’ uses them on roles. `manage_server` and `manage_messages` are role fields;
 * the rest come from a role's `perms`. Matching ignores case and underscores, so 'kickMembers' works too.
 */
export const PermissionFlags = Object.freeze({
  ManageServer: 'manage_server',
  ManageMessages: 'manage_messages',
  ManageRoles: 'manage_roles',
  ManageChannels: 'manage_channels',
  ManageNicknames: 'manage_nicknames',
  ManageWebhooks: 'manage_webhooks',
  KickMembers: 'kick_members',
  BanMembers: 'ban_members',
  TimeoutMembers: 'timeout_members',
  MoveMembers: 'move_members',
  Connect: 'connect',
  Speak: 'speak',
});

export const GatewayOpcodes = Object.freeze({
  Hello: 'hello',
  Identify: 'identify',
  Resume: 'resume',
  Ready: 'ready',
  Event: 'event',
  Heartbeat: 'heartbeat',
  HeartbeatAck: 'heartbeat_ack',
});

export const GatewayCloseCodes = Object.freeze({
  Normal: 1000,
  ServerBusy: 1013,
  NotIdentified: 4002,
  GatewayDisabled: 4003,
  AuthenticationFailed: 4004,
  TooManySockets: 4008,
  HeartbeatTimeout: 4009,
  RateLimited: 4029,
});

/** Everything Yapin’ documents as a hard limit. Builders check against these. */
export const Limits = Object.freeze({
  MessageContent: 2000,
  EmbedsPerMessage: 5,
  EmbedTitle: 256,
  EmbedDescription: 4096,
  EmbedFields: 10,
  EmbedFieldName: 256,
  EmbedFieldValue: 1024,
  EmbedAuthorName: 256,
  EmbedFooterText: 2048,
  EmbedTotal: 6000,
  EmbedURL: 512,
  ActionRowsPerMessage: 5,
  ButtonsPerRow: 5,
  ButtonLabel: 80,
  CustomId: 100,
  ComponentsV2Total: 40,
  ComponentsV2Text: 4000,
  SectionTexts: 3,
  MediaGalleryItems: 10,
  MediaDescription: 1024,
  Commands: 100,
  CommandName: 32,
  CommandDescription: 100,
  BulkDelete: 100,
  MessagesFetch: 100,
  MembersPage: 500,
  DisplayName: 32,
  Bio: 300,
  Activity: 60,
  Nickname: 32,
  TimeoutMinutes: 40_320,
  TimeoutReason: 200,
  Slowmode: 21_600,
  AvatarBytes: 8 * 1024 * 1024,
  BannerBytes: 10 * 1024 * 1024,
  InteractionResponses: 10,
  InteractionTTL: 15 * 60_000,
  InteractionAckWindow: 3000,
  WebhookEmbeds: 10,
  WebhookEmbedFields: 25,
  WebhookUsername: 80,
  EventPollWait: 25,
  EventMaxAge: 86_400,
});

/** Hosts Yapin’ accepts for embed pictures and Components V2 media (besides its own uploads). */
export const AllowedMediaHosts = Object.freeze([
  'files.yapper.website',
  'www.yapin.gg',
  'i.imgur.com',
  'media.tenor.com',
  'media.giphy.com',
  'i.giphy.com',
  'upload.wikimedia.org',
  'raw.githubusercontent.com',
  'avatars.githubusercontent.com',
  'user-images.githubusercontent.com',
  'i.ytimg.com',
  'cdn.discordapp.com',
  'media.discordapp.net',
  'pbs.twimg.com',
  'i.redd.it',
  'static-cdn.jtvnw.net',
  'i.scdn.co',
  's4.anilist.co',
  'cdn.myanimelist.net',
  'nekos.best',
  'cdn.weeb.sh',
]);

export const Colors = Object.freeze({
  Default: 0x000000,
  White: 0xffffff,
  Blurple: 0x5865f2,
  Blue: 0x3498db,
  Green: 0x57f287,
  DarkGreen: 0x1f8b4c,
  Yellow: 0xfee75c,
  Gold: 0xf1c40f,
  Orange: 0xe67e22,
  Red: 0xed4245,
  DarkRed: 0x992d22,
  Fuchsia: 0xeb459e,
  Purple: 0x9b59b6,
  Navy: 0x34495e,
  Aqua: 0x1abc9c,
  Grey: 0x95a5a6,
  Gray: 0x95a5a6,
  DarkGrey: 0x607d8b,
  Yapin: 0xff6b4a,
});
