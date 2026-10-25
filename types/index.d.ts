// Type definitions for yapin.js
// They give autocomplete and type checking in editors, also for plain JavaScript projects.

import { EventEmitter } from 'node:events';
import type { IncomingMessage, Server as HttpServer, ServerResponse } from 'node:http';

export const version: string;

// ─── Constants ───────────────────────────────────────────────────────────────

export const DefaultBaseURL: string;
export const DefaultGatewayURL: string;
export const DefaultWebhookBaseURL: string;
export const SiteURL: string;
export const FilesURL: string;

export declare const Events: {
  readonly ClientReady: 'ready';
  readonly MessageCreate: 'messageCreate';
  readonly ServerMemberAdd: 'serverMemberAdd';
  readonly ServerMemberRemove: 'serverMemberRemove';
  readonly MessageReactionAdd: 'messageReactionAdd';
  readonly MessageReactionRemove: 'messageReactionRemove';
  readonly InteractionCreate: 'interactionCreate';
  readonly VoiceJoin: 'voiceJoin';
  readonly VoiceLeave: 'voiceLeave';
  readonly Test: 'test';
  readonly CommandRun: 'commandRun';
  readonly CommandSuccess: 'commandSuccess';
  readonly CommandError: 'commandError';
  readonly CommandDenied: 'commandDenied';
  readonly CommandsSynced: 'commandsSynced';
  readonly ModuleLoad: 'moduleLoad';
  readonly ModuleUnload: 'moduleUnload';
  readonly Connected: 'connected';
  readonly Disconnected: 'disconnected';
  readonly RateLimited: 'rateLimited';
  readonly Raw: 'raw';
  readonly Error: 'error';
  readonly Warn: 'warn';
  readonly Debug: 'debug';
};

export type GatewayEventType =
  | 'message' | 'member_join' | 'member_leave' | 'reaction_add' | 'reaction_remove'
  | 'interaction' | 'voice_join' | 'voice_leave' | 'test';

export declare const GatewayEventTypes: {
  readonly Message: 'message';
  readonly MemberJoin: 'member_join';
  readonly MemberLeave: 'member_leave';
  readonly ReactionAdd: 'reaction_add';
  readonly ReactionRemove: 'reaction_remove';
  readonly Interaction: 'interaction';
  readonly VoiceJoin: 'voice_join';
  readonly VoiceLeave: 'voice_leave';
  readonly Test: 'test';
};

export declare const Intents: {
  readonly Messages: 'message';
  readonly Interactions: 'interaction';
  readonly MemberJoin: 'member_join';
  readonly MemberLeave: 'member_leave';
  readonly Members: readonly ['member_join', 'member_leave'];
  readonly ReactionAdd: 'reaction_add';
  readonly ReactionRemove: 'reaction_remove';
  readonly Reactions: readonly ['reaction_add', 'reaction_remove'];
  readonly VoiceJoin: 'voice_join';
  readonly VoiceLeave: 'voice_leave';
  readonly Voice: readonly ['voice_join', 'voice_leave'];
  readonly Test: 'test';
  readonly All: readonly GatewayEventType[];
};

export type ChannelTypeValue = 'text' | 'voice' | 'dm' | 'category';
export declare const ChannelType: { readonly Text: 'text'; readonly Voice: 'voice'; readonly DM: 'dm'; readonly Category: 'category' };

export type ButtonStyleValue = 'primary' | 'secondary' | 'success' | 'danger' | 'link';
export declare const ButtonStyle: {
  readonly Primary: 'primary'; readonly Secondary: 'secondary'; readonly Success: 'success'; readonly Danger: 'danger'; readonly Link: 'link';
};

export declare const ComponentType: {
  readonly ActionRow: 1; readonly Button: 2; readonly Section: 9; readonly TextDisplay: 10; readonly Thumbnail: 11;
  readonly MediaGallery: 12; readonly File: 13; readonly Separator: 14; readonly Container: 17;
};
export declare const SeparatorSpacingSize: { readonly Small: 1; readonly Large: 2 };
export declare const MessageFlags: { readonly IsComponentsV2: 32768 };
export declare const InteractionType: { readonly Button: 'button' };
export type InteractionResponseTypeValue = 'reply' | 'ephemeral' | 'update' | 'ack';
export declare const InteractionResponseType: { readonly Reply: 'reply'; readonly Ephemeral: 'ephemeral'; readonly Update: 'update'; readonly Ack: 'ack' };
export type PresenceStatusValue = 'online' | 'idle' | 'dnd';
export declare const PresenceStatus: { readonly Online: 'online'; readonly Idle: 'idle'; readonly DoNotDisturb: 'dnd' };
export declare const PermissionFlags: {
  readonly ManageServer: 'manage_server'; readonly ManageMessages: 'manage_messages'; readonly ManageRoles: 'manage_roles';
  readonly ManageChannels: 'manage_channels'; readonly ManageNicknames: 'manage_nicknames'; readonly ManageWebhooks: 'manage_webhooks';
  readonly KickMembers: 'kick_members'; readonly BanMembers: 'ban_members'; readonly TimeoutMembers: 'timeout_members';
  readonly MoveMembers: 'move_members'; readonly Connect: 'connect'; readonly Speak: 'speak';
};
export declare const GatewayOpcodes: {
  readonly Hello: 'hello'; readonly Identify: 'identify'; readonly Resume: 'resume'; readonly Ready: 'ready';
  readonly Event: 'event'; readonly Heartbeat: 'heartbeat'; readonly HeartbeatAck: 'heartbeat_ack';
};
export declare const GatewayCloseCodes: {
  readonly Normal: 1000; readonly ServerBusy: 1013; readonly NotIdentified: 4002; readonly GatewayDisabled: 4003;
  readonly AuthenticationFailed: 4004; readonly TooManySockets: 4008; readonly HeartbeatTimeout: 4009; readonly RateLimited: 4029;
};
export declare const Limits: Readonly<Record<
  | 'MessageContent' | 'EmbedsPerMessage' | 'EmbedTitle' | 'EmbedDescription' | 'EmbedFields' | 'EmbedFieldName'
  | 'EmbedFieldValue' | 'EmbedAuthorName' | 'EmbedFooterText' | 'EmbedTotal' | 'EmbedURL' | 'ActionRowsPerMessage'
  | 'ButtonsPerRow' | 'ButtonLabel' | 'CustomId' | 'ComponentsV2Total' | 'ComponentsV2Text' | 'SectionTexts'
  | 'MediaGalleryItems' | 'MediaDescription' | 'Commands' | 'CommandName' | 'CommandDescription' | 'BulkDelete'
  | 'MessagesFetch' | 'MembersPage' | 'DisplayName' | 'Bio' | 'Activity' | 'Nickname' | 'TimeoutMinutes'
  | 'TimeoutReason' | 'Slowmode' | 'AvatarBytes' | 'BannerBytes' | 'InteractionResponses' | 'InteractionTTL'
  | 'InteractionAckWindow' | 'WebhookEmbeds' | 'WebhookEmbedFields' | 'WebhookUsername' | 'EventPollWait' | 'EventMaxAge',
  number
>>;
export declare const AllowedMediaHosts: readonly string[];
export declare const Colors: Readonly<Record<
  | 'Default' | 'White' | 'Blurple' | 'Blue' | 'Green' | 'DarkGreen' | 'Yellow' | 'Gold' | 'Orange' | 'Red' | 'DarkRed'
  | 'Fuchsia' | 'Purple' | 'Navy' | 'Aqua' | 'Grey' | 'Gray' | 'DarkGrey' | 'Yapin',
  number
>>;

export type Snowflake = string;
export type ColorResolvable = number | string | [number, number, number] | keyof typeof Colors;
export type Awaitable<T> = T | Promise<T>;

// ─── Utilities ───────────────────────────────────────────────────────────────

export class Collection<K, V> extends Map<K, V> {
  first(): V | undefined;
  first(amount: number): V[];
  firstKey(): K | undefined;
  firstKey(amount: number): K[];
  last(): V | undefined;
  last(amount: number): V[];
  lastKey(): K | undefined;
  lastKey(amount: number): K[];
  at(index: number): V | undefined;
  keyAt(index: number): K | undefined;
  random(): V | undefined;
  random(amount: number): V[];
  find(fn: (value: V, key: K, collection: this) => unknown): V | undefined;
  findKey(fn: (value: V, key: K, collection: this) => unknown): K | undefined;
  filter(fn: (value: V, key: K, collection: this) => unknown): Collection<K, V>;
  partition(fn: (value: V, key: K, collection: this) => unknown): [Collection<K, V>, Collection<K, V>];
  map<T>(fn: (value: V, key: K, collection: this) => T): T[];
  mapValues<T>(fn: (value: V, key: K, collection: this) => T): Collection<K, T>;
  flatMap<T>(fn: (value: V, key: K, collection: this) => Collection<K, T>): Collection<K, T>;
  some(fn: (value: V, key: K, collection: this) => unknown): boolean;
  every(fn: (value: V, key: K, collection: this) => unknown): boolean;
  reduce<T = V>(fn: (accumulator: T, value: V, key: K, collection: this) => T, initial?: T): T;
  sweep(fn: (value: V, key: K, collection: this) => unknown): number;
  each(fn: (value: V, key: K, collection: this) => void): this;
  tap(fn: (collection: this) => void): this;
  hasAll(...keys: K[]): boolean;
  hasAny(...keys: K[]): boolean;
  ensure(key: K, make: (key: K, collection: this) => V): V;
  clone(): Collection<K, V>;
  concat(...collections: ReadonlyMap<K, V>[]): Collection<K, V>;
  intersect(other: ReadonlyMap<K, unknown>): Collection<K, V>;
  difference(other: ReadonlyMap<K, V>): Collection<K, V>;
  sort(compare?: (a: V, b: V, aKey: K, bKey: K) => number): this;
  toSorted(compare?: (a: V, b: V, aKey: K, bKey: K) => number): Collection<K, V>;
  equals(other: ReadonlyMap<K, V>): boolean;
  toJSON(): unknown[];
  static defaultSort(a: unknown, b: unknown): number;
}

export class LimitedCollection<K, V> extends Collection<K, V> {
  constructor(maxSize?: number, entries?: Iterable<readonly [K, V]>);
  maxSize: number;
}

export interface LoggerLike {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  child?(name: string): LoggerLike;
}

export class Logger implements LoggerLike {
  constructor(options?: { level?: 'debug' | 'info' | 'warn' | 'error' | 'silent'; prefix?: string; sink?: Console });
  level: string;
  prefix: string;
  enabled(level: string): boolean;
  child(name: string): Logger;
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

export function userMention(user: string | { id: string }): string;
export function channelMention(channel: string | { id: string }): string;
export function formatEmoji(name: string, id: string): string;
export function bold(text: string): string;
export function italic(text: string): string;
export function strikethrough(text: string): string;
export function inlineCode(text: string): string;
export function codeBlock(code: string): string;
export function codeBlock(language: string, code: string): string;
export function quote(text: string): string;
export function hyperlink(text: string, url: string | URL): string;
export function heading(text: string, level?: 1 | 2 | 3): string;
export function unorderedList(items: string[]): string;
export function orderedList(items: string[], start?: number): string;
export function escapeMarkdown(text: string): string;
export declare const MentionPatterns: { readonly User: RegExp; readonly Channel: RegExp; readonly Emoji: RegExp };
export function cdn(bucket: 'avatars' | 'banners' | 'icons' | 'attachments' | string, path: string | null | undefined): string | null;
export declare const CDN: {
  avatar(path: string | null | undefined): string | null;
  banner(path: string | null | undefined): string | null;
  icon(path: string | null | undefined): string | null;
  attachment(path: string | null | undefined): string | null;
};

export function parseDuration(input: string | number): number | null;
export function formatDuration(ms: number): string;
export function splitMessage(text: string, options?: { max?: number; char?: string | string[] }): string[];
export function sleep(ms: number, signal?: AbortSignal): Promise<void>;

// ─── Errors ──────────────────────────────────────────────────────────────────

export declare const ErrorCodes: {
  readonly TokenMissing: 'TokenMissing'; readonly TokenInvalid: 'TokenInvalid'; readonly NotReady: 'NotReady';
  readonly AlreadyLoggedIn: 'AlreadyLoggedIn'; readonly RequestTimeout: 'RequestTimeout'; readonly NetworkError: 'NetworkError';
  readonly InvalidPayload: 'InvalidPayload'; readonly ValidationError: 'ValidationError'; readonly InteractionExpired: 'InteractionExpired';
  readonly InteractionTooManyResponses: 'InteractionTooManyResponses'; readonly CollectorTimeout: 'CollectorTimeout';
  readonly ModuleLoadFailed: 'ModuleLoadFailed'; readonly ModuleNotFound: 'ModuleNotFound'; readonly CommandConflict: 'CommandConflict';
  readonly CommandLimit: 'CommandLimit'; readonly VoiceUnavailable: 'VoiceUnavailable'; readonly WebhookSignatureInvalid: 'WebhookSignatureInvalid';
  readonly OAuth2Error: 'OAuth2Error'; readonly NotInServer: 'NotInServer';
};
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/** Where an error happened; set by yapin.js on errors it reports. */
export interface ErrorTags {
  module?: string;
  command?: string;
  where?: string;
}

export class YapinError extends Error implements ErrorTags {
  constructor(code: ErrorCode, message: string, options?: { cause?: unknown });
  code: ErrorCode;
  module?: string;
  command?: string;
  where?: string;
}

export class YapinAPIError extends Error implements ErrorTags {
  status: number;
  method: string;
  path: string;
  url: string;
  body: unknown;
  /** Seconds, when Yapin’ said how long to wait. */
  retryAfter: number | null;
  code?: number | string;
  readonly isRateLimit: boolean;
  readonly isMissingPermissions: boolean;
  readonly isNotFound: boolean;
  module?: string;
  command?: string;
  where?: string;
}

export class RateLimitError extends YapinAPIError {
  /** True for the bot-wide ("overall") message limit. */
  global: boolean;
}

export class UserError extends Error {
  constructor(message: string, options?: { identifier?: string; context?: unknown; silent?: boolean });
  identifier: string;
  context: unknown;
  silent: boolean;
}

export class ArgumentError extends UserError {
  option?: string;
  value?: unknown;
  reason: 'invalid' | 'missing' | string;
}

export class PreconditionError extends UserError {
  precondition?: 'serverOnly' | 'dmOnly' | 'ownerOnly' | 'roles' | 'permissions' | 'check' | 'cooldown' | string;
}

export class CooldownError extends PreconditionError {
  /** Milliseconds left. */
  remaining: number;
}

// ─── REST ────────────────────────────────────────────────────────────────────

export interface RESTOptions {
  token?: string;
  baseURL?: string;
  timeout?: number;
  retries?: number;
  /** Longest Retry-After (seconds) that is waited out instead of thrown. */
  maxRetryAfter?: number;
  userAgent?: string;
  fetch?: typeof fetch;
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | Date | null | undefined>;
  body?: unknown;
  contentType?: string;
  headers?: Record<string, string>;
  auth?: boolean;
  retries?: number;
  timeout?: number;
  signal?: AbortSignal;
  baseURL?: string;
}

export interface RateLimitInfo {
  method: string;
  path: string;
  retryAfter: number | null;
  global: boolean;
  message: string;
}

export class REST extends EventEmitter {
  constructor(options?: RESTOptions);
  options: Required<Omit<RESTOptions, 'token' | 'fetch'>>;
  readonly hasToken: boolean;
  setToken(token: string | null): this;
  request<T = any>(options: RequestOptions & { method: string; path: string }): Promise<T>;
  get<T = any>(path: string, options?: RequestOptions): Promise<T>;
  post<T = any>(path: string, options?: RequestOptions): Promise<T>;
  put<T = any>(path: string, options?: RequestOptions): Promise<T>;
  patch<T = any>(path: string, options?: RequestOptions): Promise<T>;
  delete<T = any>(path: string, options?: RequestOptions): Promise<T>;
  on(event: 'rateLimited', listener: (info: RateLimitInfo) => void): this;
  on(event: 'request' | 'response', listener: (info: { method: string; path: string; attempt: number; status?: number }) => void): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this;
}

export declare const Routes: {
  me(): string; meAvatar(): string; meBanner(): string; meStatus(): string; events(): string; commands(): string;
  servers(): string; server(id: string): string; serverChannels(id: string): string; serverCategories(id: string): string;
  serverCategory(id: string, categoryId: string): string; serverRoles(id: string): string; serverMembers(id: string): string;
  serverMember(id: string, userId: string): string; serverMemberRole(id: string, userId: string, roleId: string): string;
  serverKick(id: string): string; serverBans(id: string): string; serverBan(id: string, userId: string): string;
  serverTimeouts(id: string): string; serverVoice(id: string): string; serverVoiceMove(id: string): string;
  serverVoiceDisconnect(id: string): string; serverVoiceJoin(id: string): string; serverVoiceLeave(id: string): string;
  channels(): string; channel(id: string): string; channelMessages(id: string): string; channelBulkDelete(id: string): string;
  channelMessage(id: string, messageId: string): string; channelMessagePin(id: string, messageId: string): string;
  channelMessageReactions(id: string, messageId: string): string; channelMessageReaction(id: string, messageId: string, emoji: string): string;
  interactionCallback(id: string, token: string): string; user(id: string): string; userDM(id: string): string;
};

// ─── Builders ────────────────────────────────────────────────────────────────

export function enableValidators(): void;
export function disableValidators(): void;
export function isValidationEnabled(): boolean;
export function resolveColor(color: ColorResolvable): number;
export function resolveColor(color: null | undefined): null;

export interface APIEmbedField { name: string; value: string; inline?: boolean }
export interface APIEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: APIEmbedField[];
  author?: { name: string; url?: string; icon_url?: string };
  footer?: { text: string; icon_url?: string };
  thumbnail?: { url: string };
  image?: { url: string };
  timestamp?: string;
}

export class EmbedBuilder {
  constructor(data?: APIEmbed);
  data: APIEmbed;
  static from(other: APIEmbed | EmbedBuilder): EmbedBuilder;
  setTitle(title: string | null): this;
  setDescription(description: string | null): this;
  setURL(url: string | null): this;
  setColor(color: ColorResolvable | null): this;
  setAuthor(author: string | { name: string; url?: string; iconURL?: string } | null): this;
  setFooter(footer: string | { text: string; iconURL?: string } | null): this;
  setThumbnail(url: string | null): this;
  setImage(url: string | null): this;
  setTimestamp(timestamp?: Date | number | null): this;
  addFields(...fields: (APIEmbedField | APIEmbedField[])[]): this;
  addField(name: string, value: string, inline?: boolean): this;
  setFields(...fields: (APIEmbedField | APIEmbedField[])[]): this;
  spliceFields(index: number, deleteCount: number, ...fields: APIEmbedField[]): this;
  readonly length: number;
  toJSON(): APIEmbed;
}

export interface APIButton {
  type: 'button' | 2;
  style: ButtonStyleValue | 1 | 2 | 3 | 4 | 5;
  label?: string;
  emoji?: string;
  custom_id?: string;
  url?: string;
  disabled?: boolean;
}

export class ButtonBuilder {
  constructor(data?: Partial<APIButton>);
  data: APIButton;
  static primary(label: string, customId: string): ButtonBuilder;
  static secondary(label: string, customId: string): ButtonBuilder;
  static success(label: string, customId: string): ButtonBuilder;
  static danger(label: string, customId: string): ButtonBuilder;
  static link(label: string, url: string): ButtonBuilder;
  static from(other: APIButton | ButtonBuilder): ButtonBuilder;
  setStyle(style: ButtonStyleValue | 1 | 2 | 3 | 4 | 5): this;
  setLabel(label: string | null): this;
  setEmoji(emoji: string | { name: string; id?: string } | null): this;
  setCustomId(customId: string): this;
  setURL(url: string): this;
  setDisabled(disabled?: boolean): this;
  toJSON(): APIButton;
}

export interface APIActionRow { type: 'row' | 1; components: APIButton[] }

export class ActionRowBuilder {
  constructor(...components: (ButtonBuilder | APIButton | (ButtonBuilder | APIButton)[])[]);
  constructor(data: { components: (ButtonBuilder | APIButton)[] });
  components: (ButtonBuilder | APIButton)[];
  static from(other: APIActionRow | ActionRowBuilder): ActionRowBuilder;
  addComponents(...components: (ButtonBuilder | APIButton | (ButtonBuilder | APIButton)[])[]): this;
  setComponents(...components: (ButtonBuilder | APIButton | (ButtonBuilder | APIButton)[])[]): this;
  toJSON(): APIActionRow;
}

export interface APILayoutComponent { type: number; id?: number; [key: string]: unknown }
type Build<B> = B | ((builder: B) => B);

declare abstract class ComponentBuilder {
  data: APILayoutComponent;
  setId(id: number): this;
  toJSON(): APILayoutComponent;
}

export class TextDisplayBuilder extends ComponentBuilder {
  constructor(data?: string | { content?: string });
  setContent(content: string): this;
}

export class ThumbnailBuilder extends ComponentBuilder {
  constructor(data?: string | object);
  setURL(url: string): this;
  setDescription(description: string | null): this;
  setSpoiler(spoiler?: boolean): this;
}

export class SectionBuilder extends ComponentBuilder {
  constructor(data?: object);
  components: (TextDisplayBuilder | APILayoutComponent)[];
  accessory: ButtonBuilder | ThumbnailBuilder | APILayoutComponent | null;
  addTextDisplayComponents(...texts: (string | Build<TextDisplayBuilder>)[]): this;
  setButtonAccessory(button: Build<ButtonBuilder>): this;
  setThumbnailAccessory(thumbnail: string | Build<ThumbnailBuilder>): this;
}

export interface MediaGalleryItem { url: string; description?: string; spoiler?: boolean }

export class MediaGalleryBuilder extends ComponentBuilder {
  constructor(data?: object);
  items: { media: { url: string }; description?: string; spoiler?: boolean }[];
  addItems(...items: (string | MediaGalleryItem | MediaGalleryItem[])[]): this;
  addItem(url: string, options?: { description?: string; spoiler?: boolean }): this;
}

export class SeparatorBuilder extends ComponentBuilder {
  constructor(data?: { divider?: boolean; spacing?: 1 | 2 });
  setDivider(divider?: boolean): this;
  setSpacing(spacing: 1 | 2 | 'small' | 'large'): this;
}

export class FileBuilder extends ComponentBuilder {
  constructor(data?: string | object);
  setURL(url: string): this;
  setSpoiler(spoiler?: boolean): this;
}

export type ContainerChild = string | TextDisplayBuilder | SectionBuilder | MediaGalleryBuilder | SeparatorBuilder | FileBuilder | ActionRowBuilder | APILayoutComponent | APIActionRow;

export class ContainerBuilder extends ComponentBuilder {
  constructor(data?: object);
  components: ContainerChild[];
  setAccentColor(color: ColorResolvable | null): this;
  setSpoiler(spoiler?: boolean): this;
  add(...components: (ContainerChild | ContainerChild[])[]): this;
  addTextDisplayComponents(...items: (string | Build<TextDisplayBuilder>)[]): this;
  addSectionComponents(...items: Build<SectionBuilder>[]): this;
  addMediaGalleryComponents(...items: Build<MediaGalleryBuilder>[]): this;
  addSeparatorComponents(...items: Build<SeparatorBuilder>[]): this;
  addFileComponents(...items: Build<FileBuilder>[]): this;
  addActionRowComponents(...items: Build<ActionRowBuilder>[]): this;
}

export function measureLayout(components: APILayoutComponent[]): { count: number; text: number };

// ─── Payloads ────────────────────────────────────────────────────────────────

export type ComponentLike =
  | ActionRowBuilder | ContainerBuilder | SectionBuilder | TextDisplayBuilder | MediaGalleryBuilder
  | SeparatorBuilder | FileBuilder | APIActionRow | APILayoutComponent;

export interface MessageOptions {
  content?: string | null;
  embeds?: (EmbedBuilder | APIEmbed)[] | EmbedBuilder | APIEmbed | null;
  /** Button rows, or a Components V2 layout (detected for you). */
  components?: ComponentLike[] | ComponentLike | null;
  flags?: number;
  /** Quote a message. */
  replyTo?: Message | string;
  reply?: { messageReference: Message | string };
}

export type MessagePayload = string | EmbedBuilder | EmbedBuilder[] | ContainerBuilder | MessageOptions;
export type MessageEditPayload = string | EmbedBuilder | EmbedBuilder[] | ContainerBuilder | Omit<MessageOptions, 'replyTo' | 'reply'>;

export interface InteractionReplyOptions extends Omit<MessageOptions, 'replyTo' | 'reply'> {
  /** Only the person who clicked sees it (text and embeds only). */
  ephemeral?: boolean;
}

export function resolvePayload(input: MessagePayload, options?: { edit?: boolean }): Record<string, unknown>;
export function isComponentsV2(components: unknown): boolean;

// ─── Structures ──────────────────────────────────────────────────────────────

export abstract class Base {
  readonly client: Client;
  toJSON(): Record<string, unknown>;
  valueOf(): string;
}

export class User extends Base {
  id: Snowflake;
  username: string | null;
  /** The display name they set (null if none). */
  globalName: string | null;
  avatarPath: string | null;
  badges: string[];
  bot: boolean;
  partial: boolean;
  /** globalName, else username. */
  readonly displayName: string | null;
  readonly mention: string;
  avatarURL(): string | null;
  displayAvatarURL(): string | null;
  createDM(): Promise<DMChannel>;
  send(payload: MessagePayload): Promise<Message>;
  fetch(force?: boolean): Promise<User>;
  equals(other: User): boolean;
  toString(): string;
}

export interface Presence { status: PresenceStatusValue; activity: string | null }

export class ClientUser extends User {
  bio: string | null;
  bannerPath: string | null;
  createdAt: Date | null;
  presence: Presence;
  bannerURL(): string | null;
  edit(options: { displayName?: string; bio?: string }): Promise<this>;
  setDisplayName(displayName: string): Promise<this>;
  setUsername(displayName: string): Promise<this>;
  setBio(bio: string): Promise<this>;
  setAvatar(image: ImageResolvable | null, contentType?: string): Promise<this>;
  setBanner(image: ImageResolvable | null, contentType?: string): Promise<this>;
  setPresence(presence: { status?: PresenceStatusValue; activity?: string | null }): Promise<Presence>;
  setStatus(status: PresenceStatusValue): Promise<Presence>;
  setActivity(activity: string | null): Promise<Presence>;
}

export type ImageResolvable = string | URL | Uint8Array | ArrayBuffer | Blob;

export class Server extends Base {
  id: Snowflake;
  name: string | null;
  iconPath: string | null;
  ownerId: Snowflake | null;
  memberCount: number | null;
  partial: boolean;
  channels: ServerChannelManager;
  members: MemberManager;
  roles: RoleManager;
  bans: BanManager;
  voice: ServerVoiceManager;
  readonly owner: ServerMember | null;
  readonly me: ServerMember | null;
  iconURL(): string | null;
  fetchOwner(): Promise<ServerMember>;
  fetch(force?: boolean): Promise<Server>;
}

export class Permissions {
  constructor(names?: Iterable<string>, options?: { all?: boolean });
  all: boolean;
  set: Set<string>;
  static fromRole(role: Role | { manageServer?: boolean; manageMessages?: boolean; perms?: Record<string, unknown> }): Permissions;
  static fromRoles(roles: Iterable<Role | object>, options?: { owner?: boolean }): Permissions;
  has(...permissions: (string | string[])[]): boolean;
  any(...permissions: (string | string[])[]): boolean;
  missing(...permissions: (string | string[])[]): string[];
  toArray(): string[];
}

export class Role extends Base {
  id: Snowflake;
  serverId: Snowflake;
  name: string;
  color: string | null;
  position: number;
  manageServer: boolean;
  manageMessages: boolean;
  /** The role's other permissions, as Yapin’ sends them. */
  perms: Record<string, unknown>;
  auto: string | null;
  readonly server: Server | null;
  readonly permissions: Permissions;
  readonly hexColor: string | null;
  readonly members: Collection<Snowflake, ServerMember> | undefined;
  comparePositionTo(other: Role | Snowflake): number;
}

export class MemberRoleManager {
  readonly member: ServerMember;
  readonly ids: Snowflake[];
  readonly cache: Collection<Snowflake, Role>;
  readonly highest: Role | null;
  has(role: Role | Snowflake | string): boolean;
  add(role: Role | Snowflake | string): Promise<ServerMember>;
  remove(role: Role | Snowflake | string): Promise<ServerMember>;
}

export type DurationResolvable = number | string;

export class ServerMember extends Base {
  serverId: Snowflake;
  user: User;
  nickname: string | null;
  joinedAt: Date | null;
  roleIds: Snowflake[];
  roles: MemberRoleManager;
  /** The active timeout as Yapin’ sent it, if any. */
  activeTimeout: Record<string, unknown> | null;
  partial: boolean;
  readonly id: Snowflake;
  readonly server: Server | null;
  readonly displayName: string | null;
  readonly permissions: Permissions;
  readonly communicationDisabledUntil: Date | null;
  readonly voice: { channelId: Snowflake | null; readonly channel: VoiceChannel | null; move(channel: VoiceChannel | Snowflake): Promise<void>; disconnect(): Promise<void> };
  isTimedOut(): boolean;
  kick(): Promise<void>;
  ban(): Promise<void>;
  /** Milliseconds, or a duration string like '10m'. Up to 28 days; 0 clears. */
  timeout(duration: DurationResolvable | null, reason?: string): Promise<unknown>;
  removeTimeout(): Promise<unknown>;
  disableCommunicationUntil(date: Date | number | null, reason?: string): Promise<unknown>;
  setNickname(nickname: string | null): Promise<this>;
  send(payload: MessagePayload): Promise<Message>;
  createDM(): Promise<DMChannel>;
  fetch(force?: boolean): Promise<ServerMember>;
}

export class Ban extends Base {
  serverId: Snowflake;
  userId: Snowflake;
  user: User;
  bannedById: Snowflake | null;
  createdAt: Date | null;
  readonly server: Server | null;
  readonly bannedBy: User | null;
  remove(): Promise<void>;
}

export interface AwaitMessagesOptions extends CollectorOptions<[Message]> {
  /** End reasons that reject instead of resolving, like ['time']. */
  errors?: string[];
}

export abstract class BaseChannel extends Base {
  id: Snowflake;
  type: ChannelTypeValue | null;
  name: string | null;
  partial: boolean;
  serverId?: Snowflake | null;
  isText(): this is TextChannel;
  isVoice(): this is VoiceChannel;
  isDM(): this is DMChannel;
  isCategory(): this is CategoryChannel;
  isTextBased(): this is TextChannel | DMChannel;
  inServer(): boolean;
  fetch(force?: boolean): Promise<AnyChannel>;
  delete(): Promise<this>;
}

export interface TextBasedChannel {
  messages: MessageManager;
  send(payload: MessagePayload): Promise<Message>;
  bulkDelete(messages: number | Iterable<Message | Snowflake> | Collection<Snowflake, Message>): Promise<{ deleted: Snowflake[]; skipped: Snowflake[] }>;
  createMessageCollector(options?: CollectorOptions<[Message]>): MessageCollector;
  awaitMessages(options?: AwaitMessagesOptions): Promise<Collection<Snowflake, Message>>;
}

export interface ChannelEditOptions {
  name?: string;
  category?: CategoryChannel | Snowflake | null;
  parent?: CategoryChannel | Snowflake | null;
  private?: boolean;
  /** With private: the roles that can see it. */
  roles?: (Role | Snowflake)[];
  readOnly?: boolean;
  /** With readOnly: the roles that can post. */
  postRoles?: (Role | Snowflake)[];
  /** Seconds, 0 to 21600. */
  slowmode?: number;
}

export class ServerChannel extends BaseChannel {
  serverId: Snowflake | null;
  position: number;
  categoryId: Snowflake | null;
  private: boolean;
  readOnly: boolean;
  slowmode: number;
  readonly server: Server | null;
  readonly category: CategoryChannel | null;
  readonly parent: CategoryChannel | null;
  readonly parentId: Snowflake | null;
  edit(changes: ChannelEditOptions): Promise<this>;
  setName(name: string): Promise<this>;
  setCategory(category: CategoryChannel | Snowflake | null): Promise<this>;
  setParent(category: CategoryChannel | Snowflake | null): Promise<this>;
  setSlowmode(seconds: number): Promise<this>;
  setPrivate(isPrivate?: boolean, roles?: (Role | Snowflake)[]): Promise<this>;
  setReadOnly(readOnly?: boolean, postRoles?: (Role | Snowflake)[]): Promise<this>;
}

export interface TextChannel extends TextBasedChannel {}
export class TextChannel extends ServerChannel {
  type: 'text';
}

export class VoiceChannel extends ServerChannel {
  type: 'voice';
  readonly memberIds: Snowflake[];
  readonly members: Collection<Snowflake, ServerMember> | null;
  join(options?: VoiceConnectOptions): Promise<VoiceConnection>;
}

export interface DMChannel extends TextBasedChannel {}
export class DMChannel extends BaseChannel {
  type: 'dm';
  serverId: null;
  recipientId: Snowflake | null;
  readonly recipient: User | null;
}

export class CategoryChannel extends BaseChannel {
  type: 'category';
  serverId: Snowflake;
  position: number;
  readonly server: Server | null;
  readonly children: Collection<Snowflake, ServerChannel> | undefined;
  edit(options: { name: string }): Promise<this>;
  setName(name: string): Promise<this>;
}

export type AnyChannel = TextChannel | VoiceChannel | DMChannel | CategoryChannel;
export function createChannel(client: Client, data: Record<string, unknown>): AnyChannel;

export class MessageMentions {
  readonly message: Message;
  userIds: Snowflake[];
  channelIds: Snowflake[];
  /** The bot was mentioned. */
  me: boolean;
  readonly users: Collection<Snowflake, User>;
  readonly members: Collection<Snowflake, ServerMember> | null;
  readonly channels: Collection<Snowflake, AnyChannel>;
  has(target: { id: string } | string): boolean;
}

export interface ReactionSummary { emoji: string; count: number; userIds: Snowflake[]; me: boolean }

export class Message extends Base {
  id: Snowflake;
  channelId: Snowflake;
  serverId: Snowflake | null;
  author: User | null;
  content: string;
  embeds: APIEmbed[];
  components: (APIActionRow | APILayoutComponent)[];
  createdTimestamp: number | null;
  editedAt: Date | null;
  attachmentPath: string | null;
  replyToId: Snowflake | null;
  pinnedAt: Date | null;
  /** Sent by another bot or a webhook. */
  authorBot?: boolean;
  partial: boolean;
  readonly authorId: Snowflake | null;
  readonly createdAt: Date | null;
  readonly editedTimestamp: number | null;
  readonly channel: TextChannel | DMChannel;
  readonly server: Server | null;
  readonly member: ServerMember | null;
  readonly mentions: MessageMentions;
  /** The bot was @mentioned. */
  readonly mentioned: boolean;
  readonly attachmentURL: string | null;
  readonly pinned: boolean;
  readonly reference: { messageId: Snowflake; channelId: Snowflake; serverId: Snowflake | null } | null;
  readonly isComponentsV2: boolean;
  readonly editable: boolean;
  inServer(): boolean;
  fetchMember(): Promise<ServerMember | null>;
  reply(payload: MessagePayload): Promise<Message>;
  edit(payload: MessageEditPayload): Promise<Message>;
  delete(): Promise<void>;
  react(emoji: string): Promise<unknown>;
  unreact(emoji: string): Promise<unknown>;
  fetchReactions(): Promise<Collection<string, ReactionSummary>>;
  pin(): Promise<unknown>;
  unpin(): Promise<unknown>;
  fetch(): Promise<Message>;
  fetchReference(): Promise<Message | null>;
  createReactionCollector(options?: CollectorOptions<[MessageReaction, User]> & { dispose?: boolean }): ReactionCollector;
  awaitReactions(options?: CollectorOptions<[MessageReaction, User]> & { errors?: string[] }): Promise<Collection<string, MessageReaction>>;
  createMessageComponentCollector(options?: InteractionCollectorOptions): InteractionCollector;
  awaitMessageComponent(options?: { filter?: (interaction: ButtonInteraction) => Awaitable<boolean>; time?: number }): Promise<ButtonInteraction>;
  equals(other: Message): boolean;
}

export class ButtonInteraction extends Base {
  id: Snowflake;
  readonly token: string;
  type: 'button';
  customId: string;
  messageId: Snowflake | null;
  channelId: Snowflake | null;
  serverId: Snowflake | null;
  user: User;
  expiresAt: Date;
  createdAt: Date;
  /** Named parts of the custom_id from a router pattern like 'vote:{choice}'. */
  params: Record<string, string>;
  /** The RegExp match, when the route was a RegExp. */
  match?: RegExpExecArray;
  replied: boolean;
  deferred: boolean;
  responses: number;
  readonly userId: Snowflake;
  readonly customID: string;
  readonly channel: TextChannel | DMChannel | null;
  readonly server: Server | null;
  readonly member: ServerMember | null;
  readonly message: Message | null;
  readonly responded: boolean;
  fetchMessage(): Promise<Message>;
  fetchMember(): Promise<ServerMember | null>;
  isButton(): boolean;
  isExpired(): boolean;
  inServer(): boolean;
  reply(payload: string | EmbedBuilder | InteractionReplyOptions): Promise<unknown>;
  ephemeral(payload: string | EmbedBuilder | InteractionReplyOptions): Promise<unknown>;
  update(payload: MessageEditPayload): Promise<unknown>;
  deferUpdate(): Promise<unknown>;
  ack(): Promise<unknown>;
  followUp(payload: string | EmbedBuilder | InteractionReplyOptions): Promise<unknown>;
}
export { ButtonInteraction as Interaction };

export class MessageReaction extends Base {
  emoji: string;
  messageId: Snowflake;
  channelId: Snowflake;
  serverId: Snowflake | null;
  messageAuthorId: Snowflake | null;
  userId: Snowflake;
  readonly channel: TextChannel | DMChannel;
  readonly server: Server | null;
  readonly message: Message;
  readonly user: User;
  readonly member: ServerMember | null;
  readonly onOwnMessage: boolean;
  fetchMessage(): Promise<Message>;
  react(): Promise<unknown>;
}

export class VoiceState extends Base {
  userId: Snowflake;
  channelId: Snowflake;
  serverId: Snowflake;
  joined: boolean;
  readonly user: User;
  readonly member: ServerMember | null;
  readonly channel: VoiceChannel;
  readonly server: Server | null;
  readonly isMe: boolean;
}

// ─── Managers ────────────────────────────────────────────────────────────────

export abstract class CachedManager<K, V> {
  readonly client: Client;
  cache: Collection<K, V>;
  resolve(idOrInstance: V | K | { id: K }): V | null;
  resolveId(idOrInstance: V | K | { id: K }): K | null;
}

export interface FetchOptions { force?: boolean; cache?: boolean }

export class UserManager extends CachedManager<Snowflake, User> {
  dmChannels: Map<Snowflake, Snowflake>;
  fetch(user: User | Snowflake, options?: FetchOptions): Promise<User>;
  createDM(user: User | Snowflake): Promise<DMChannel>;
  send(user: User | Snowflake, payload: MessagePayload): Promise<Message>;
}

export class ServerManager extends CachedManager<Snowflake, Server> {
  fetch(): Promise<Collection<Snowflake, Server>>;
  fetch(server: Server | Snowflake, options?: FetchOptions): Promise<Server>;
}

export class ChannelManager extends CachedManager<Snowflake, AnyChannel> {
  fetch(channel: AnyChannel | Snowflake, options?: FetchOptions): Promise<AnyChannel>;
  fetchAll(options?: { type?: 'text' | 'voice' }): Promise<Collection<Snowflake, AnyChannel>>;
  send(channel: AnyChannel | Snowflake | Promise<AnyChannel>, payload: MessagePayload): Promise<Message>;
}

export class ServerChannelManager {
  readonly server: Server;
  readonly client: Client;
  cache: Collection<Snowflake, ServerChannel | CategoryChannel>;
  readonly categories: Collection<Snowflake, CategoryChannel>;
  fetch(options?: { type?: 'text' | 'voice' }): Promise<Collection<Snowflake, ServerChannel | CategoryChannel>>;
  fetch(channel: Snowflake | { id: Snowflake }, options?: FetchOptions): Promise<AnyChannel>;
  create(name: string, options?: { type?: 'text' | 'voice'; category?: CategoryChannel | Snowflake; parent?: CategoryChannel | Snowflake }): Promise<TextChannel | VoiceChannel>;
  create(options: { name: string; type?: 'text' | 'voice'; category?: CategoryChannel | Snowflake }): Promise<TextChannel | VoiceChannel>;
  createCategory(name: string): Promise<CategoryChannel>;
  delete(channel: AnyChannel | Snowflake): Promise<unknown>;
  findByName(name: string, type?: ChannelTypeValue): ServerChannel | CategoryChannel | null;
  /** When every channel was last fetched (ms), 0 if never. */
  fetchedAt: number;
  /** Fetches every channel unless that was done in the last `maxAge` ms (default 60 000). */
  ensure(maxAge?: number): Promise<Collection<Snowflake, ServerChannel | CategoryChannel>>;
}

export class MemberManager extends CachedManager<Snowflake, ServerMember> {
  readonly server: Server;
  readonly me: ServerMember | null;
  fetchMe(options?: FetchOptions): Promise<ServerMember>;
  fetch(): Promise<Collection<Snowflake, ServerMember>>;
  fetch(options: { limit?: number; after?: Snowflake | User }): Promise<Collection<Snowflake, ServerMember>>;
  fetch(user: User | ServerMember | Snowflake, options?: FetchOptions): Promise<ServerMember>;
  list(options?: { limit?: number; after?: Snowflake | User }): Promise<Collection<Snowflake, ServerMember>>;
  iterate(options?: { pageSize?: number }): AsyncGenerator<ServerMember>;
  kick(user: User | ServerMember | Snowflake): Promise<void>;
  ban(user: User | ServerMember | Snowflake): Promise<void>;
  unban(user: User | ServerMember | Snowflake): Promise<void>;
  timeout(user: User | ServerMember | Snowflake, duration: DurationResolvable | null, reason?: string): Promise<unknown>;
  setNickname(user: User | ServerMember | Snowflake, nickname: string | null): Promise<void>;
  addRole(user: User | ServerMember | Snowflake, role: Role | Snowflake): Promise<void>;
  removeRole(user: User | ServerMember | Snowflake, role: Role | Snowflake): Promise<void>;
  search(query: string): Collection<Snowflake, ServerMember>;
}

export class RoleManager extends CachedManager<Snowflake, Role> {
  readonly server: Server;
  fetchedAt: number;
  readonly highest: Role | null;
  fetch(): Promise<Collection<Snowflake, Role>>;
  fetch(role: Snowflake, options?: FetchOptions): Promise<Role | null>;
  ensure(maxAge?: number): Promise<Collection<Snowflake, Role>>;
  resolve(role: Role | Snowflake | string): Role | null;
}

export class BanManager {
  readonly server: Server;
  cache: Collection<Snowflake, Ban>;
  fetch(): Promise<Collection<Snowflake, Ban>>;
  create(user: User | ServerMember | Snowflake): Promise<void>;
  remove(user: User | ServerMember | Snowflake): Promise<void>;
}

export class MessageManager extends CachedManager<Snowflake, Message> {
  readonly channel: TextChannel | DMChannel;
  fetch(message: Message | Snowflake, options?: FetchOptions): Promise<Message>;
  fetch(options?: { limit?: number; before?: Date | string | Message; after?: Date | string | Message }): Promise<Collection<Snowflake, Message>>;
  edit(message: Message | Snowflake, payload: MessageEditPayload): Promise<Message>;
  delete(message: Message | Snowflake): Promise<void>;
  bulkDelete(messages: number | Iterable<Message | Snowflake> | Collection<Snowflake, Message>): Promise<{ deleted: Snowflake[]; skipped: Snowflake[] }>;
  react(message: Message | Snowflake, emoji: string): Promise<unknown>;
  unreact(message: Message | Snowflake, emoji: string): Promise<unknown>;
  fetchReactions(message: Message | Snowflake): Promise<Collection<string, ReactionSummary>>;
  pin(message: Message | Snowflake): Promise<unknown>;
  unpin(message: Message | Snowflake): Promise<unknown>;
}

export interface VoiceTicket {
  url: string;
  token: string;
  e2ee: boolean;
  voice_muted: boolean;
  channel_id: Snowflake;
  server_id: Snowflake;
  expires_in: number;
}

export class ServerVoiceManager {
  readonly server: Server;
  readonly client: Client;
  states: Collection<Snowflake, VoiceState>;
  readonly connection: VoiceConnection | null;
  fetch(): Promise<Collection<Snowflake, Snowflake[]>>;
  channelOf(user: User | ServerMember | Snowflake): Promise<Snowflake | null>;
  move(user: User | ServerMember | Snowflake, channel: VoiceChannel | Snowflake): Promise<void>;
  disconnect(user: User | ServerMember | Snowflake): Promise<void>;
  join(channel: VoiceChannel | Snowflake): Promise<VoiceTicket>;
  connect(channel: VoiceChannel | Snowflake, options?: VoiceConnectOptions): Promise<VoiceConnection>;
  leave(): Promise<void>;
}

// ─── Voice ───────────────────────────────────────────────────────────────────

export interface VoiceConnectOptions {
  /** The @livekit/rtc-node module (loaded for you when installed). */
  rtc?: unknown;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
}

export class VoiceConnection extends EventEmitter {
  room: any;
  source: any;
  track: any;
  serverId: Snowflake;
  channelId: Snowflake;
  sampleRate: number;
  channels: number;
  e2ee: boolean;
  muted: boolean;
  volume: number;
  paused: boolean;
  playing: unknown;
  destroyed: boolean;
  readonly client: Client;
  readonly server: Server | null;
  readonly channel: VoiceChannel | null;
  setVolume(volume: number): this;
  pause(): this;
  resume(): this;
  stop(): this;
  playPCM(input: AsyncIterable<Uint8Array>, options?: { signal?: AbortSignal }): Promise<void>;
  play(input: string | NodeJS.ReadableStream, options?: { ffmpeg?: string; seek?: number; args?: string[]; signal?: AbortSignal }): Promise<void>;
  leave(): Promise<void>;
  disconnect(): Promise<void>;
  on(event: 'start' | 'finish', listener: (input: unknown) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'disconnect', listener: () => void): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this;
}

export class ClientVoiceManager {
  readonly client: Client;
  connections: Collection<Snowflake, VoiceConnection>;
  rtc(): Promise<unknown>;
  connect(server: Server | Snowflake, channel: VoiceChannel | Snowflake, options?: VoiceConnectOptions): Promise<VoiceConnection>;
  leave(server: Server | Snowflake): Promise<void>;
  destroy(): Promise<void>;
}

// ─── Collectors ──────────────────────────────────────────────────────────────

export interface CollectorOptions<A extends unknown[]> {
  filter?: (...args: [...A, Collection<any, any>]) => Awaitable<unknown>;
  time?: number;
  idle?: number;
  max?: number;
  maxProcessed?: number;
  dispose?: boolean;
}

export class Collector<K, V, A extends unknown[] = [V]> extends EventEmitter implements AsyncIterable<V> {
  readonly client: Client;
  collected: Collection<K, V>;
  ended: boolean;
  endReason: string | null;
  processed: number;
  stop(reason?: string): void;
  resetTimer(options?: { time?: number; idle?: number }): void;
  checkEnd(): boolean;
  readonly next: Promise<V>;
  [Symbol.asyncIterator](): AsyncIterator<V>;
  on(event: 'collect' | 'ignore' | 'dispose', listener: (...args: A) => void): this;
  on(event: 'end', listener: (collected: Collection<K, V>, reason: string) => void): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this;
  once(event: 'collect' | 'ignore' | 'dispose', listener: (...args: A) => void): this;
  once(event: 'end', listener: (collected: Collection<K, V>, reason: string) => void): this;
  once(event: string | symbol, listener: (...args: any[]) => void): this;
}

export class MessageCollector extends Collector<Snowflake, Message> {
  constructor(channel: TextChannel | DMChannel, options?: CollectorOptions<[Message]>);
  channel: TextChannel | DMChannel;
}

export interface InteractionCollectorOptions extends CollectorOptions<[ButtonInteraction]> {
  message?: Message | Snowflake;
  channel?: AnyChannel | Snowflake;
  server?: Server | Snowflake;
  user?: User | Snowflake;
  customId?: string | RegExp;
}

export class InteractionCollector extends Collector<Snowflake, ButtonInteraction> {
  constructor(client: Client, options?: InteractionCollectorOptions);
}

export class ReactionCollector extends Collector<string, MessageReaction, [MessageReaction, User]> {
  constructor(message: Message, options?: CollectorOptions<[MessageReaction, User]> & { dispose?: boolean });
  message: Message;
}

// ─── Commands ────────────────────────────────────────────────────────────────

export type OptionType = 'string' | 'integer' | 'number' | 'boolean' | 'user' | 'member' | 'channel' | 'role' | 'duration' | 'url' | (string & {});

export interface CommandOptionDefinition {
  name: string;
  description?: string;
  type?: OptionType;
  required?: boolean;
  /** Takes the rest of the line (strings) or every remaining word (other types, as an array). Last option only. */
  rest?: boolean;
  default?: unknown | ((ctx: CommandContext) => unknown);
  choices?: (string | number | { name: string; value: unknown })[];
  /** Numbers: the value. Strings: the length. Durations: milliseconds. */
  min?: number;
  max?: number;
  channelTypes?: ChannelTypeValue[];
  validate?(value: any, ctx: CommandContext): Awaitable<true | undefined | false | string>;
}

export type CooldownScope = 'user' | 'member' | 'channel' | 'server' | 'global';

export type CommandCheck = (ctx: CommandContext) => Awaitable<boolean | string | void>;

export interface CommandDefinition {
  name: string;
  description?: string;
  aliases?: string[];
  category?: string;
  options?: (CommandOptionDefinition | string)[];
  examples?: string[];
  serverOnly?: boolean;
  dmOnly?: boolean;
  ownerOnly?: boolean;
  /** Permissions the author needs (all of them). */
  permissions?: string[];
  /** Roles (ids or names); the author needs at least one. */
  roles?: string[];
  checks?: CommandCheck[] | CommandCheck;
  /** Seconds per user, or { seconds | ms, scope, uses }. */
  cooldown?: number | { seconds?: number; ms?: number; scope?: CooldownScope; uses?: number };
  /** Not listed in "/" or /help, still runs. */
  hidden?: boolean;
  /** false: prefix-only, not sent to Yapin’ (doesn't count towards the 100). */
  register?: boolean;
  subcommands?: (CommandDefinition | Command)[];
  run?(ctx: CommandContext): Awaitable<unknown>;
  /** discord.js name for run. */
  execute?(ctx: CommandContext): Awaitable<unknown>;
}

export class Command {
  constructor(definition: CommandDefinition, options?: { owner?: unknown; file?: string | null; parent?: Command | null });
  name: string;
  description: string;
  aliases: string[];
  category: string | null;
  options: Required<Pick<CommandOptionDefinition, 'name' | 'type' | 'required' | 'rest' | 'description'>>[] & CommandOptionDefinition[];
  examples: string[];
  serverOnly: boolean;
  dmOnly: boolean;
  ownerOnly: boolean;
  permissions: string[];
  roles: string[];
  checks: CommandCheck[];
  cooldown: { duration: number; scope: CooldownScope; uses: number } | null;
  hidden: boolean;
  register: boolean;
  run: ((ctx: CommandContext) => Awaitable<unknown>) | null;
  owner: unknown;
  file: string | null;
  parent: Command | null;
  subcommands: Collection<string, Command>;
  definition: CommandDefinition;
  readonly path: string;
  findSubcommand(name: string): Command | null;
  usage(prefix?: string): string;
  toJSON(): { name: string; description: string };
}

export class OptionResolver {
  constructor(values?: Record<string, unknown>);
  values: Record<string, any>;
  get<T = any>(name: string, required?: boolean): T | null;
  has(name: string): boolean;
  getString(name: string, required: true): string;
  getString(name: string, required?: boolean): string | null;
  getInteger(name: string, required: true): number;
  getInteger(name: string, required?: boolean): number | null;
  getNumber(name: string, required: true): number;
  getNumber(name: string, required?: boolean): number | null;
  getBoolean(name: string, required: true): boolean;
  getBoolean(name: string, required?: boolean): boolean | null;
  getUser(name: string, required: true): User;
  getUser(name: string, required?: boolean): User | null;
  getMember(name: string, required: true): ServerMember;
  getMember(name: string, required?: boolean): ServerMember | null;
  getChannel(name: string, required: true): AnyChannel;
  getChannel(name: string, required?: boolean): AnyChannel | null;
  getRole(name: string, required: true): Role;
  getRole(name: string, required?: boolean): Role | null;
  getDuration(name: string, required: true): number;
  getDuration(name: string, required?: boolean): number | null;
  toJSON(): Record<string, unknown>;
}

export class CommandContext {
  readonly client: Client;
  message: Message;
  command: Command;
  prefix: string;
  commandName: string;
  args: string;
  argv: string[];
  options: OptionResolver;
  state: Record<string, any>;
  startedAt: number;
  readonly values: Record<string, any>;
  readonly author: User;
  readonly user: User;
  readonly authorId: Snowflake;
  readonly channel: TextChannel | DMChannel;
  readonly channelId: Snowflake;
  readonly server: Server | null;
  readonly guild: Server | null;
  readonly serverId: Snowflake | null;
  readonly member: ServerMember | null;
  readonly usage: string;
  fetchMember(): Promise<ServerMember | null>;
  inServer(): boolean;
  reply(payload: MessagePayload): Promise<Message>;
  send(payload: MessagePayload): Promise<Message>;
  react(emoji: string): Promise<unknown>;
  error(message: string, options?: { identifier?: string; silent?: boolean }): never;
}

export interface ArgumentType {
  resolve(text: string, ctx: CommandContext, option: CommandOptionDefinition): Awaitable<unknown>;
}

export declare const BuiltinTypes: Record<'string' | 'integer' | 'number' | 'boolean' | 'user' | 'member' | 'channel' | 'role' | 'duration' | 'url', ArgumentType>;

export class ArgumentTypeRegistry extends Map<string, ArgumentType> {
  register(name: string, resolve: ((text: string, ctx: CommandContext, option: CommandOptionDefinition) => Awaitable<unknown>) | ArgumentType, options?: { message?: string }): this;
}

export function tokenize(input: string): { value: string; start: number; end: number; quoted: boolean }[];
export function parseArguments(ctx: CommandContext, command: Command, types: ArgumentTypeRegistry): Promise<Record<string, unknown>>;

export class CooldownManager {
  take(command: Command, ctx: CommandContext): number;
  reset(command: Command, ctx: CommandContext): void;
  sweep(): void;
  destroy(): void;
}

export type CommandMiddleware = (ctx: CommandContext, next: () => Promise<void>) => unknown;

export class CommandHandler {
  readonly client: Client;
  registry: Collection<string, Command>;
  aliases: Map<string, string>;
  types: ArgumentTypeRegistry;
  cooldowns: CooldownManager;
  middleware: CommandMiddleware[];
  files: Map<string, { version: number; label: string; url: string }>;
  readonly size: number;
  readonly names: string[];
  register(definition: CommandDefinition | Command, options?: { owner?: unknown; file?: string | null }): Command;
  register(definitions: (CommandDefinition | Command)[], options?: { owner?: unknown; file?: string | null }): Command[];
  get(name: string): Command | null;
  has(name: string): boolean;
  unregister(name: string): boolean;
  use(middleware: CommandMiddleware): this;
  load(target: string | URL, options?: { recursive?: boolean }): Promise<string[]>;
  reload(name: string): Promise<string[]>;
  toJSON(): { name: string; description: string }[];
  sync(options?: { force?: boolean }): Promise<{ name: string; description: string }[]>;
  scheduleSync(): void;
  fetchRemote(): Promise<{ name: string; description?: string }[]>;
}

export function createHelpCommand(handler: CommandHandler, options?: { name?: string; color?: ColorResolvable; title?: string; aliases?: string[] }): CommandDefinition;

// ─── Components ──────────────────────────────────────────────────────────────

export type ComponentPattern = string | RegExp;
export type ButtonHandler = (interaction: ButtonInteraction, params: Record<string, string>) => Awaitable<unknown>;

export function compilePattern(pattern: ComponentPattern): (customId: string) => Record<string, string> | null;

export class ComponentRouter {
  readonly client: Client;
  routes: { pattern: ComponentPattern; handler: ButtonHandler; owner: unknown; once: boolean }[];
  button(pattern: ComponentPattern, handler: ButtonHandler, options?: { once?: boolean }): () => void;
  on(pattern: ComponentPattern, handler: ButtonHandler, options?: { once?: boolean }): () => void;
  once(pattern: ComponentPattern, handler: ButtonHandler): () => void;
  remove(handler: ButtonHandler): void;
}

// ─── Modules ─────────────────────────────────────────────────────────────────

export class ModuleContext {
  readonly client: Client;
  readonly name: string;
  readonly logger: LoggerLike;
  command(definition: CommandDefinition): Command;
  on<E extends keyof ClientEvents>(event: E, listener: (...args: ClientEvents[E]) => unknown): this;
  on(event: string, listener: (...args: any[]) => unknown): this;
  once<E extends keyof ClientEvents>(event: E, listener: (...args: ClientEvents[E]) => unknown): this;
  once(event: string, listener: (...args: any[]) => unknown): this;
  button(pattern: ComponentPattern, handler: ButtonHandler): () => void;
  setTimeout(fn: () => void, ms: number): NodeJS.Timeout;
  setInterval(fn: () => void, ms: number): NodeJS.Timeout;
  onUnload(fn: () => unknown): this;
}

export type ModuleEvents = { [E in keyof ClientEvents]?: ((...args: ClientEvents[E]) => unknown) | ((...args: ClientEvents[E]) => unknown)[] };

export abstract class Module {
  constructor(context: ModuleContext);
  readonly context: ModuleContext;
  readonly client: Client;
  readonly logger: LoggerLike;
  name?: string;
  commands?: CommandDefinition[] | Record<string, CommandDefinition | CommandDefinition['run']>;
  events?: ModuleEvents;
  buttons?: Record<string, ButtonHandler>;
  check?(ctx: CommandContext): Awaitable<boolean | string | void>;
  load?(context: ModuleContext): Awaitable<void>;
  unload?(context: ModuleContext): Awaitable<void>;
  command(definition: CommandDefinition): Command;
  on<E extends keyof ClientEvents>(event: E, listener: (...args: ClientEvents[E]) => unknown): ModuleContext;
  once<E extends keyof ClientEvents>(event: E, listener: (...args: ClientEvents[E]) => unknown): ModuleContext;
  button(pattern: ComponentPattern, handler: ButtonHandler): () => void;
  setTimeout(fn: () => void, ms: number): NodeJS.Timeout;
  setInterval(fn: () => void, ms: number): NodeJS.Timeout;
  onUnload(fn: () => unknown): ModuleContext;
}

export interface ModuleDefinition {
  name?: string;
  commands?: CommandDefinition[] | Record<string, CommandDefinition | CommandDefinition['run']>;
  events?: ModuleEvents;
  buttons?: Record<string, ButtonHandler>;
  check?(ctx: CommandContext): Awaitable<boolean | string | void>;
  setup?(context: ModuleContext): Awaitable<void>;
  teardown?(context: ModuleContext): Awaitable<void>;
}

/** `this` inside a defineModule({…}): the definition, plus the ModuleContext's client, logger and helpers. */
export type ModuleDefinitionThis<T> = T & Omit<ModuleContext, keyof T> & { readonly context: ModuleContext };
export function defineModule<T extends ModuleDefinition>(definition: T & ThisType<ModuleDefinitionThis<T>>): T;
export function isModuleClass(value: unknown): boolean;

export interface ModuleRecord {
  name: string;
  file: string | null;
  label: string;
  version: number;
  instances: Module[];
  definition: ModuleDefinition | null;
  loadedAt: Date | null;
}

export class ModuleManager {
  readonly client: Client;
  cache: Collection<string, ModuleRecord>;
  get(name: string): ModuleRecord | null;
  has(name: string): boolean;
  load(target: string | URL, options?: { recursive?: boolean }): Promise<string | string[]>;
  add(module: (new (context: ModuleContext) => Module) | Module | ModuleDefinition, options?: { name?: string }): Promise<string>;
  unload(name: string): Promise<string>;
  reload(name: string): Promise<string>;
  reloadAll(): Promise<string[]>;
  watch(options?: { debounce?: number }): () => void;
}

// ─── Event stream ────────────────────────────────────────────────────────────

export interface RawEvent<T = Record<string, any>> {
  id: number;
  type: GatewayEventType | string;
  data: T;
  created_at: string;
}

export interface SequenceStore {
  get(): Awaitable<number>;
  set(seq: number): Awaitable<void>;
  flush?(): Awaitable<void>;
}

export class MemorySequenceStore implements SequenceStore {
  constructor(initial?: number);
  value: number;
  get(): number;
  set(seq: number): void;
}

export class FileSequenceStore implements SequenceStore {
  constructor(path: string, options?: { debounce?: number });
  path: string;
  get(): Promise<number>;
  set(seq: number): void;
  flush(): Promise<void>;
}

export class EventStream extends EventEmitter {
  readonly client: Client;
  seq: number;
  running: boolean;
  transport: 'gateway' | 'polling' | null;
  ping: number | null;
  start(seq: number): void;
  stop(): Promise<void>;
  ingest(event: RawEvent): boolean;
}

// ─── Webhooks & OAuth2 ───────────────────────────────────────────────────────

export declare const WebhookErrorCodes: {
  readonly UnknownWebhook: 10015; readonly InvalidToken: 50027; readonly EmptyMessage: 50006; readonly InvalidFormBody: 50035;
  readonly InvalidJSON: 50109; readonly MissingAccess: 50001; readonly PayloadTooLarge: 40005;
};

export interface WebhookMessageOptions {
  content?: string;
  username?: string;
  avatarURL?: string;
  embeds?: (EmbedBuilder | APIEmbed)[];
  allowedMentions?: { parse?: ('users' | 'roles' | 'everyone')[]; users?: string[]; roles?: string[] };
  /** Return the posted message (default true). */
  wait?: boolean;
}

export class WebhookClient {
  constructor(options: { url: string } | { id: string; token: string }, settings?: { baseURL?: string; retries?: number; fetch?: typeof fetch });
  id: string;
  readonly token: string;
  readonly url: string;
  send(payload: string | WebhookMessageOptions): Promise<Record<string, any> | null>;
  fetchWebhook(): Promise<Record<string, any>>;
}

export function verifyWebhookSignature(rawBody: string | Uint8Array, signature: string | undefined | null, secret: string): boolean;
export type WebhookRequestHandler = (req: IncomingMessage & { rawBody?: Buffer }, res: ServerResponse, next?: () => void) => Promise<void>;
export function createWebhookHandler(client: Client, options: { secret: string; path?: string; maxBodySize?: number }): WebhookRequestHandler;
export function startWebhookServer(client: Client, options: { secret: string; port?: number; host?: string; path?: string }): Promise<HttpServer>;

export interface OAuth2Token {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: Date | null;
  scope: string;
  raw: Record<string, unknown>;
}

export class OAuth2Client {
  constructor(options: { clientId: string; clientSecret?: string; redirectURI: string; baseURL?: string; fetch?: typeof fetch });
  clientId: string;
  redirectURI: string;
  static generateState(bytes?: number): string;
  static generatePKCE(): { verifier: string; challenge: string; method: 'S256' };
  generateAuthURL(options: { state: string; scope?: string | string[]; codeChallenge?: string }): string;
  exchangeCode(code: string, options?: { codeVerifier?: string }): Promise<OAuth2Token>;
  fetchUser(accessToken: string): Promise<{ id: string; username: string; displayName: string | null; avatarURL: string | null; raw: Record<string, unknown> }>;
}

// ─── Client ──────────────────────────────────────────────────────────────────

export interface ClientOptions {
  /** Defaults to process.env.YAPIN_TOKEN, then YAPPER_BOT_TOKEN. */
  token?: string;
  baseURL?: string;
  gatewayURL?: string;
  /** 'auto' (default): the gateway when possible, else long polling. */
  transport?: 'auto' | 'gateway' | 'polling';
  /** yapper.js compatibility: false = polling only, a string = gateway URL. */
  gateway?: false | string;
  intents?: (GatewayEventType | readonly GatewayEventType[])[] | null;
  prefixes?: string[] | string | ((message: Message) => Awaitable<string[] | string>);
  prefix?: string | string[];
  ignoreBots?: boolean;
  maxEventAge?: number | null;
  sequenceStore?: string | SequenceStore | null;
  presence?: { status?: PresenceStatusValue; activity?: string | null } | null;
  rest?: { timeout?: number; retries?: number; maxRetryAfter?: number };
  cache?: { messages?: number; users?: number; members?: number };
  commands?: {
    autoSync?: boolean;
    registerAliases?: boolean;
    replyOnError?: boolean;
    errorMessage?: string;
    formatError?: ((error: unknown, ctx: CommandContext) => Awaitable<MessagePayload | null | undefined>) | null;
    caseSensitive?: boolean;
    mentionPrefix?: boolean;
    help?: boolean | { name?: string; color?: ColorResolvable; title?: string; aliases?: string[] };
    owners?: Snowflake[];
    ownersBypassCooldowns?: boolean;
  };
  components?: { autoAck?: boolean; autoAckAfter?: number };
  voice?: { rtc?: unknown };
  logger?: boolean | 'debug' | 'info' | 'warn' | 'error' | 'silent' | LoggerLike | { level?: string; prefix?: string };
  WebSocket?: (new (url: string) => any) | false;
  fetch?: typeof fetch;
}

export interface ClientEvents {
  ready: [client: Client];
  messageCreate: [message: Message];
  serverMemberAdd: [member: ServerMember];
  serverMemberRemove: [member: ServerMember];
  messageReactionAdd: [reaction: MessageReaction, user: User];
  messageReactionRemove: [reaction: MessageReaction, user: User];
  interactionCreate: [interaction: ButtonInteraction];
  voiceJoin: [state: VoiceState];
  voiceLeave: [state: VoiceState];
  test: [data: { bot?: string; by?: string; at?: string; hello?: unknown; [key: string]: unknown }];
  commandRun: [ctx: CommandContext];
  commandSuccess: [ctx: CommandContext, durationMs: number];
  commandError: [error: Error, ctx: CommandContext];
  commandDenied: [error: UserError, ctx: CommandContext];
  commandsSynced: [commands: { name: string; description: string }[]];
  moduleLoad: [module: ModuleRecord];
  moduleUnload: [module: ModuleRecord];
  connected: [info: { transport: 'gateway' | 'polling'; previous: 'gateway' | 'polling' | null }];
  disconnected: [info: { transport: 'gateway' | 'polling'; code?: number }];
  rateLimited: [info: RateLimitInfo];
  raw: [event: RawEvent];
  error: [error: Error & ErrorTags];
  warn: [message: string];
  debug: [message: string];
}

export interface Application {
  id: Snowflake;
  name: string;
  public: boolean;
  ownerId: Snowflake | null;
}

export declare const DefaultClientOptions: Readonly<Required<Omit<ClientOptions, 'gateway' | 'prefix'>>>;

export class Client extends EventEmitter {
  constructor(options?: ClientOptions);
  options: Required<Omit<ClientOptions, 'gateway' | 'prefix'>>;
  logger: LoggerLike;
  readonly token: string | null;
  rest: REST;
  user: ClientUser | null;
  application: Application | null;
  readyAt: Date | null;
  users: UserManager;
  servers: ServerManager;
  readonly guilds: ServerManager;
  channels: ChannelManager;
  commands: CommandHandler;
  components: ComponentRouter;
  modules: ModuleManager;
  voice: ClientVoiceManager;
  stream: EventStream;
  sequenceStore: SequenceStore | null;
  readonly readyTimestamp: number | null;
  readonly uptime: number | null;
  readonly ping: number | null;
  readonly transport: 'gateway' | 'polling' | null;
  isReady(): this is Client & { user: ClientUser; application: Application; readyAt: Date };
  login(token?: string): Promise<string>;
  destroy(): Promise<void>;
  send(channel: AnyChannel | Snowflake, payload: MessagePayload): Promise<Message>;
  command(definition: CommandDefinition): Command;
  command(name: string, run: (ctx: CommandContext) => Awaitable<unknown>): Command;
  command(name: string, description: string, run: (ctx: CommandContext) => Awaitable<unknown>): Command;
  button(pattern: ComponentPattern, handler: ButtonHandler): () => void;
  webhookHandler(options: { secret: string; path?: string; maxBodySize?: number }): WebhookRequestHandler;

  on<E extends keyof ClientEvents>(event: E, listener: (...args: ClientEvents[E]) => unknown): this;
  on(event: string | symbol, listener: (...args: any[]) => unknown): this;
  once<E extends keyof ClientEvents>(event: E, listener: (...args: ClientEvents[E]) => unknown): this;
  once(event: string | symbol, listener: (...args: any[]) => unknown): this;
  off<E extends keyof ClientEvents>(event: E, listener: (...args: ClientEvents[E]) => unknown): this;
  off(event: string | symbol, listener: (...args: any[]) => unknown): this;
  emit<E extends keyof ClientEvents>(event: E, ...args: ClientEvents[E]): boolean;
  emit(event: string | symbol, ...args: unknown[]): boolean;
}
