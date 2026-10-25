import { ComponentType, Limits, SeparatorSpacingSize } from '../util/Constants.js';
import { toJSON } from '../util/util.js';
import { ActionRowBuilder } from './ActionRowBuilder.js';
import { ButtonBuilder } from './ButtonBuilder.js';
import { checkCount, checkLength, checkURL, fail, isValidationEnabled, resolveColor } from './validation.js';

/** A builder, a function that fills a fresh builder (`(b) => b.setContent('hi')`), or plain data. */
function build(input, Builder) {
  if (typeof input === 'function') return input(new Builder());
  if (input instanceof Builder) return input;
  if (typeof input === 'string' && Builder === TextDisplayBuilder) return new TextDisplayBuilder().setContent(input);
  return input;
}

class ComponentBuilder {
  constructor(type, data = {}) {
    this.data = { ...data, type };
  }

  /** A whole number unique in the message. Left out, Yapin’ counts up from 1. */
  setId(id) {
    this.data.id = id;
    return this;
  }

  toJSON() {
    return { ...this.data };
  }
}

/** Markdown text (type 10). Mentions, links and emoji work like in messages; no HTML. */
export class TextDisplayBuilder extends ComponentBuilder {
  constructor(data = {}) {
    super(ComponentType.TextDisplay, typeof data === 'string' ? { content: data } : data);
  }

  setContent(content) {
    this.data.content = checkLength(content, Limits.ComponentsV2Text, 'Text display', 1);
    return this;
  }

  toJSON() {
    if (isValidationEnabled() && !this.data.content) fail('A text display needs content');
    return super.toJSON();
  }
}

/** A small picture (type 11), only as a section's accessory. */
export class ThumbnailBuilder extends ComponentBuilder {
  constructor(data = {}) {
    super(ComponentType.Thumbnail, typeof data === 'string' ? { media: { url: data } } : data);
  }

  setURL(url) {
    this.data.media = { url: checkURL(url, 'Thumbnail URL', { httpsOnly: true }) };
    return this;
  }

  setDescription(description) {
    this.data.description = description == null ? undefined : checkLength(description, Limits.MediaDescription, 'Thumbnail description');
    return this;
  }

  setSpoiler(spoiler = true) {
    this.data.spoiler = Boolean(spoiler);
    return this;
  }

  toJSON() {
    if (isValidationEnabled() && !this.data.media?.url) fail('A thumbnail needs a URL (setURL)');
    return super.toJSON();
  }
}

/** 1 to 3 text displays with a button or a thumbnail beside them (type 9). */
export class SectionBuilder extends ComponentBuilder {
  constructor(data = {}) {
    super(ComponentType.Section);
    this.components = (data.components ?? []).map((c) => build(c, TextDisplayBuilder));
    this.accessory = data.accessory ?? null;
  }

  /** Strings, TextDisplayBuilders, or `(b) => b.setContent(…)`. */
  addTextDisplayComponents(...texts) {
    this.components.push(...texts.flat().map((t) => build(t, TextDisplayBuilder)));
    checkCount(this.components.length, Limits.SectionTexts, 'text displays in a section');
    return this;
  }

  setButtonAccessory(button) {
    this.accessory = build(button, ButtonBuilder);
    return this;
  }

  /** A ThumbnailBuilder, a picture URL, or `(b) => b.setURL(…)`. */
  setThumbnailAccessory(thumbnail) {
    this.accessory = typeof thumbnail === 'string' ? new ThumbnailBuilder().setURL(thumbnail) : build(thumbnail, ThumbnailBuilder);
    return this;
  }

  toJSON() {
    if (isValidationEnabled()) {
      if (!this.components.length) fail('A section needs 1 to 3 text displays');
      if (!this.accessory) fail('A section needs an accessory: setButtonAccessory or setThumbnailAccessory');
    }
    return { ...this.data, components: this.components.map(toJSON), accessory: toJSON(this.accessory) };
  }
}

/** 1 to 10 pictures or mp4 / webm / mov videos in a grid (type 12). */
export class MediaGalleryBuilder extends ComponentBuilder {
  constructor(data = {}) {
    super(ComponentType.MediaGallery);
    this.items = [...(data.items ?? [])];
  }

  /** addItems('https://…', { url, description, spoiler }, …) */
  addItems(...items) {
    for (const item of items.flat()) {
      const { url, media, description, spoiler } = typeof item === 'string' ? { url: item } : toJSON(item);
      this.items.push({
        media: { url: checkURL(url ?? media?.url, 'Gallery item URL', { httpsOnly: true }) },
        description: description == null ? undefined : checkLength(description, Limits.MediaDescription, 'Gallery item description'),
        spoiler: spoiler || undefined,
      });
    }
    checkCount(this.items.length, Limits.MediaGalleryItems, 'gallery items');
    return this;
  }

  addItem(url, { description, spoiler } = {}) {
    return this.addItems({ url, description, spoiler });
  }

  toJSON() {
    if (isValidationEnabled() && !this.items.length) fail('A media gallery needs 1 to 10 items');
    return { ...this.data, items: this.items.map((i) => ({ ...i })) };
  }
}

/** A line or empty space (type 14). */
export class SeparatorBuilder extends ComponentBuilder {
  constructor(data = {}) {
    super(ComponentType.Separator, { divider: true, spacing: SeparatorSpacingSize.Small, ...data });
  }

  setDivider(divider = true) {
    this.data.divider = Boolean(divider);
    return this;
  }

  /** SeparatorSpacingSize.Small (1) or .Large (2); 'small' / 'large' work too. */
  setSpacing(spacing) {
    this.data.spacing = spacing === 'large' || spacing === SeparatorSpacingSize.Large ? SeparatorSpacingSize.Large : SeparatorSpacingSize.Small;
    return this;
  }
}

/** A file to download (type 13): an https link to a Yapin’ upload or an allowed host. */
export class FileBuilder extends ComponentBuilder {
  constructor(data = {}) {
    super(ComponentType.File, typeof data === 'string' ? { file: { url: data } } : data);
  }

  setURL(url) {
    this.data.file = { url: checkURL(url, 'File URL', { httpsOnly: true }) };
    return this;
  }

  setSpoiler(spoiler = true) {
    this.data.spoiler = Boolean(spoiler);
    return this;
  }

  toJSON() {
    if (isValidationEnabled() && !this.data.file?.url) fail('A file component needs a URL (setURL)');
    return super.toJSON();
  }
}

/**
 * A card holding other components (type 17), with an optional accent bar.
 *
 *   new ContainerBuilder()
 *     .setAccentColor('Blurple')
 *     .addTextDisplayComponents('## Game night')
 *     .addSectionComponents((s) => s.addTextDisplayComponents('**Minecraft**').setButtonAccessory(ButtonBuilder.primary('Vote', 'poll:mc')))
 *     .addSeparatorComponents(new SeparatorBuilder())
 *     .addActionRowComponents(new ActionRowBuilder(ButtonBuilder.link('Rules', 'https://example.com')))
 *
 * `add(...)` takes any mix of parts; plain strings become text displays.
 */
export class ContainerBuilder extends ComponentBuilder {
  constructor(data = {}) {
    super(ComponentType.Container);
    this.components = [...(data.components ?? [])];
    if (data.accent_color !== undefined) this.data.accent_color = data.accent_color;
    if (data.spoiler !== undefined) this.data.spoiler = data.spoiler;
  }

  setAccentColor(color) {
    if (color == null) delete this.data.accent_color;
    else this.data.accent_color = resolveColor(color);
    return this;
  }

  setSpoiler(spoiler = true) {
    this.data.spoiler = Boolean(spoiler);
    return this;
  }

  add(...components) {
    for (const c of components.flat()) {
      if (c instanceof ContainerBuilder || c?.type === ComponentType.Container) fail('A container cannot hold another container');
      this.components.push(typeof c === 'string' ? new TextDisplayBuilder().setContent(c) : c);
    }
    return this;
  }

  addTextDisplayComponents(...items) {
    return this.add(items.flat().map((i) => build(i, TextDisplayBuilder)));
  }

  addSectionComponents(...items) {
    return this.add(items.flat().map((i) => build(i, SectionBuilder)));
  }

  addMediaGalleryComponents(...items) {
    return this.add(items.flat().map((i) => build(i, MediaGalleryBuilder)));
  }

  addSeparatorComponents(...items) {
    return this.add((items.length ? items.flat() : [new SeparatorBuilder()]).map((i) => build(i, SeparatorBuilder)));
  }

  addFileComponents(...items) {
    return this.add(items.flat().map((i) => build(i, FileBuilder)));
  }

  addActionRowComponents(...items) {
    return this.add(items.flat().map((i) => build(i, ActionRowBuilder)));
  }

  toJSON() {
    if (isValidationEnabled() && !this.components.length) fail('A container needs at least one component');
    return { ...this.data, components: this.components.map(toJSON) };
  }
}

/** Counts components (nested ones too, gallery items not) and text characters in a V2 layout of builders or JSON. */
export function measureLayout(components) {
  let count = 0;
  let text = 0;
  const walk = (part) => {
    const c = toJSON(part);
    count++;
    if (c.type === ComponentType.TextDisplay) text += c.content?.length ?? 0;
    for (const child of c.components ?? []) walk(child);
    if (c.accessory) walk(c.accessory);
  };
  for (const c of components) walk(c);
  return { count, text };
}

export function validateLayout(components) {
  if (!isValidationEnabled()) return;
  const { count, text } = measureLayout(components);
  if (count > Limits.ComponentsV2Total) fail(`This layout has ${count} components; the limit is ${Limits.ComponentsV2Total} (nested ones count)`);
  if (text > Limits.ComponentsV2Text) fail(`This layout has ${text} characters of text; the limit is ${Limits.ComponentsV2Text}`);
}
