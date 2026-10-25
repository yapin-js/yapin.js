import { Collection } from '../util/Collection.js';
import { Events } from '../util/Constants.js';
import { ErrorCodes, YapinError, tagError } from '../errors/index.js';
import { basename, importFile, listFiles, locate } from '../util/loader.js';
import { isModuleClass, isModuleDefinition } from './Module.js';

/**
 * What a module gets to register things with. Everything registered through it is removed again
 * when the module unloads, and errors from it are tagged with the module's name.
 */
export class ModuleContext {
  constructor(manager, record) {
    Object.defineProperty(this, 'manager', { value: manager });
    Object.defineProperty(this, 'record', { value: record });
    this.client = manager.client;
  }

  get name() {
    return this.record.name;
  }

  get logger() {
    return this.client.logger.child(this.record.name);
  }

  command(definition) {
    return this.client.commands.register(definition, { owner: this.record });
  }

  #wrap(event, listener) {
    const record = this.record;
    const client = this.client;
    return function moduleListener(...args) {
      const report = (error) => client._reportError(tagError(error, { module: record.name, where: event }));
      try {
        const out = listener.apply(this, args);
        if (out && typeof out.catch === 'function') out.catch(report);
      } catch (error) {
        report(error);
      }
    };
  }

  on(event, listener) {
    const wrapped = this.#wrap(event, listener);
    this.client.on(event, wrapped);
    this.record.listeners.push([event, wrapped]);
    return this;
  }

  once(event, listener) {
    const wrapped = this.#wrap(event, listener);
    this.client.once(event, wrapped);
    this.record.listeners.push([event, wrapped]);
    return this;
  }

  button(pattern, handler) {
    return this.client.components.button(pattern, handler, { owner: this.record });
  }

  setTimeout(fn, ms) {
    const timer = setTimeout(() => {
      this.record.timeouts.delete(timer);
      fn();
    }, ms);
    this.record.timeouts.add(timer);
    return timer;
  }

  setInterval(fn, ms) {
    const timer = setInterval(fn, ms);
    this.record.intervals.add(timer);
    return timer;
  }

  onUnload(fn) {
    this.record.cleanups.push(fn);
    return this;
  }
}

const CONTEXT_KEYS = new Set(['context', 'client', 'logger', 'command', 'on', 'once', 'button', 'setTimeout', 'setInterval', 'onUnload']);

/**
 * `this` inside a defineModule({…}): the definition itself, plus `this.client`, `this.logger`
 * and the ModuleContext helpers, the way a Module class has them. The definition's own keys win.
 */
function definitionThis(definition, context) {
  return new Proxy(definition, {
    get(target, key, receiver) {
      if (key in target || !CONTEXT_KEYS.has(key)) return Reflect.get(target, key, receiver);
      if (key === 'context') return context;
      const value = context[key];
      return typeof value === 'function' ? value.bind(context) : value;
    },
    has: (target, key) => key in target || CONTEXT_KEYS.has(key),
  });
}

function makeRecord(name, { file = null, label = name, version = 0 } = {}) {
  const record = {
    name,
    file,
    label,
    version,
    instances: [],
    definition: null,
    listeners: [],
    timeouts: new Set(),
    intervals: new Set(),
    cleanups: [],
    checks: [],
    loadedAt: null,
  };
  record.check = async (ctx) => {
    for (const check of record.checks) {
      const verdict = await check(ctx);
      if (verdict === false || typeof verdict === 'string') return verdict;
    }
    return true;
  };
  return record;
}

/** Pulls the module out of a file's exports: a Module class, defineModule({…}), or setup(ctx). */
function pickModule(mod) {
  if (isModuleClass(mod.default)) return { classes: [mod.default] };
  if (isModuleDefinition(mod.default)) return { definition: mod.default };
  if (mod.default && typeof mod.default === 'object' && (mod.default.setup || mod.default.commands || mod.default.events || mod.default.buttons)) {
    return { definition: mod.default };
  }
  if (typeof mod.setup === 'function') {
    return { definition: { name: mod.name, setup: mod.setup, teardown: mod.teardown, check: mod.check } };
  }
  if (typeof mod.default === 'function') return { definition: { setup: mod.default, teardown: mod.teardown, check: mod.check } };
  const classes = [...new Set(Object.values(mod))].filter(isModuleClass);
  if (classes.length) return { classes };
  return null;
}

/**
 * `client.modules`: load features from files, take them out again, and hot-reload them.
 *
 *   await client.modules.load('./modules');          // every .js in the folder
 *   await client.modules.reload('fun');              // after editing modules/fun.js, no restart
 *   client.modules.watch();                          // reload on save (development)
 */
export class ModuleManager {
  #version = 0;

  constructor(client) {
    Object.defineProperty(this, 'client', { value: client });
    this.cache = new Collection();
    this.watchers = new Map();
  }

  get(name) {
    return this.cache.get(name) ?? null;
  }

  has(name) {
    return this.cache.has(name);
  }

  /** A module file, or a folder of them (A to Z, subfolders too; names starting with _ are skipped). */
  load(target, { recursive = true } = {}) {
    return this.client._track((async () => {
      const found = await locate(target);
      if (!found.isDirectory) return this.#loadFile(found.path, 0);
      const names = [];
      for (const file of await listFiles(found.path, { recursive })) names.push(await this.#loadFile(file, 0));
      return names;
    })());
  }

  /** Adds a module made in code: a Module class, an instance's class, or a defineModule({…}) object. */
  add(module, { name } = {}) {
    return this.client._track((async () => {
      const source = isModuleClass(module) ? { classes: [module] } : isModuleClass(module?.constructor) ? { classes: [module.constructor] } : { definition: module };
      const recordName = name ?? module.name ?? (source.classes ? source.classes[0].name : null);
      if (!recordName) throw new YapinError(ErrorCodes.ModuleLoadFailed, 'add() needs a module with a name');
      const record = makeRecord(String(recordName), { label: `module ${recordName}` });
      await this.#mount(record, source);
      return record.name;
    })());
  }

  async #loadFile(file, version) {
    const { url, label, path } = await locate(file);
    const fallbackName = basename(label);
    let mod;
    try {
      mod = await importFile(url, version);
    } catch (cause) {
      throw new YapinError(ErrorCodes.ModuleLoadFailed, `Couldn't load ${label}: ${cause.message}`, { cause });
    }
    const source = pickModule(mod);
    if (!source) {
      throw new YapinError(ErrorCodes.ModuleLoadFailed, `${label} has no module: export a class extending Module, defineModule({…}), or setup(ctx)`);
    }
    const record = makeRecord(fallbackName, { file: path, label, version });
    await this.#mount(record, source);
    return record.name;
  }

  async #mount(record, source) {
    const context = new ModuleContext(this, record);
    const reserve = (name) => {
      if (name && name !== record.name) record.name = String(name);
      if (this.cache.has(record.name)) {
        throw new YapinError(ErrorCodes.ModuleLoadFailed, `A module called "${record.name}" is already loaded. To load it again: client.modules.reload('${record.name}')`);
      }
    };
    try {
      if (source.definition) {
        reserve(source.definition.name);
        this.cache.set(record.name, record);
        record.definition = source.definition;
        const self = definitionThis(source.definition, context);
        this.#declare(record, context, source.definition, self);
        if (typeof source.definition.setup === 'function') await source.definition.setup.call(self, context);
      } else {
        const instances = source.classes.map((C) => new C(context));
        reserve(source.classes.length === 1 && typeof instances[0].name === 'string' ? instances[0].name : undefined);
        this.cache.set(record.name, record);
        for (const instance of instances) {
          record.instances.push(instance);
          this.#declare(record, context, instance, instance);
          if (typeof instance.load === 'function') await instance.load(context);
        }
      }
    } catch (error) {
      if (this.cache.get(record.name) === record) {
        await this.#teardown(record, { quiet: true });
        this.cache.delete(record.name);
      }
      const err = error instanceof YapinError ? error : new YapinError(ErrorCodes.ModuleLoadFailed, `Couldn't load ${record.label}: ${error?.message ?? error}`, { cause: error });
      throw err;
    }
    record.loadedAt = new Date();
    this.client.emit(Events.ModuleLoad, record);
    this.client.emit(Events.Debug, `[modules] loaded ${record.name}`);
  }

  /** Registers what a module declares: commands, events, buttons and check. */
  #declare(record, context, source, self) {
    if (typeof source.check === 'function') record.checks.push((ctx) => source.check.call(self, ctx));
    const commands = source.commands;
    const list = Array.isArray(commands)
      ? commands
      : Object.entries(commands ?? {}).map(([name, def]) => (typeof def === 'function' ? { name, run: def } : { name, ...def }));
    for (const def of list) {
      const run = def.run ?? def.execute;
      context.command(typeof run === 'function' ? { ...def, run: run.bind(self) } : def);
    }
    for (const [event, listeners] of Object.entries(source.events ?? {})) {
      for (const listener of [].concat(listeners)) {
        if (typeof listener !== 'function') throw new TypeError(`events.${event} in ${record.label} must be a function`);
        context.on(event, listener.bind(self));
      }
    }
    for (const [pattern, handler] of Object.entries(source.buttons ?? source.components ?? {})) {
      if (typeof handler !== 'function') throw new TypeError(`buttons["${pattern}"] in ${record.label} must be a function`);
      context.button(pattern, handler.bind(self));
    }
  }

  async #teardown(record, { quiet = false } = {}) {
    const context = new ModuleContext(this, record);
    const hooks = [
      ...record.instances.filter((i) => typeof i.unload === 'function').map((i) => () => i.unload(context)),
      ...(typeof record.definition?.teardown === 'function' ? [() => record.definition.teardown.call(definitionThis(record.definition, context), context)] : []),
      ...record.cleanups,
    ];
    for (const hook of hooks) {
      try {
        await hook();
      } catch (error) {
        if (!quiet) this.client._reportError(tagError(error, { module: record.name, where: 'unload' }));
      }
    }
    this.client.commands._removeWhere((c) => c.owner === record);
    this.client.components._removeOwner(record);
    for (const [event, listener] of record.listeners) this.client.off(event, listener);
    for (const t of record.timeouts) clearTimeout(t);
    for (const t of record.intervals) clearInterval(t);
    record.listeners = [];
    record.timeouts.clear();
    record.intervals.clear();
    record.cleanups = [];
  }

  /** Takes a module out: its commands, buttons, listeners and timers go, and its unload hook runs. */
  async unload(name) {
    const record = this.#find(name);
    this.cache.delete(record.name);
    await this.#teardown(record);
    this.client.emit(Events.ModuleUnload, record);
    return record.name;
  }

  /**
   * Unloads a module and loads its file again, fresh from disk. If the new version fails to load,
   * the old one is put back and the error is thrown. (Files the module imports itself aren't re-read.)
   */
  async reload(name) {
    const record = this.#find(name);
    if (!record.file) throw new YapinError(ErrorCodes.ModuleNotFound, `"${record.name}" wasn't loaded from a file, so it can't be reloaded`);
    await this.unload(record.name);
    try {
      return await this.#loadFile(record.file, ++this.#version);
    } catch (error) {
      await this.#loadFile(record.file, record.version).catch(() => {});
      throw error;
    }
  }

  async reloadAll() {
    const names = [];
    for (const record of [...this.cache.values()]) if (record.file) names.push(await this.reload(record.name));
    return names;
  }

  #find(name) {
    const key = String(name ?? '');
    const record = this.cache.get(key) ?? this.cache.get(basename(key.replace(/\\/g, '/')));
    if (!record) {
      const loaded = this.cache.size ? ` (loaded: ${[...this.cache.keys()].join(', ')})` : '';
      throw new YapinError(ErrorCodes.ModuleNotFound, `No module called "${key}" is loaded${loaded}`);
    }
    return record;
  }

  /**
   * Development helper: reloads a module (or command file) when you save it. Returns a function
   * that stops watching.
   */
  watch({ debounce = 250 } = {}) {
    let stopped = false;
    const start = async () => {
      const fs = await import('node:fs');
      const watchFile = (file, reload) => {
        if (this.watchers.has(file)) return;
        let timer = null;
        const watcher = fs.watch(file, () => {
          clearTimeout(timer);
          timer = setTimeout(async () => {
            try {
              const result = await reload();
              this.client.logger.info(`reloaded ${[].concat(result).join(', ')}`);
            } catch (error) {
              this.client.logger.error(`reload failed: ${error.message}`);
            }
          }, debounce);
        });
        watcher.unref?.();
        this.watchers.set(file, watcher);
      };
      const refresh = () => {
        if (stopped) return;
        for (const record of this.cache.values()) {
          if (record.file) watchFile(record.file, () => this.reload(this.cache.find((r) => r.file === record.file)?.name ?? record.name));
        }
        for (const [file] of this.client.commands.files) {
          watchFile(file, () => {
            const command = this.client.commands.registry.find((c) => c.file === file);
            return command ? this.client.commands.reload(command.name) : [];
          });
        }
      };
      refresh();
      this.client.on(Events.ModuleLoad, refresh);
      return refresh;
    };
    const ready = start();
    return () => {
      stopped = true;
      ready.then((refresh) => this.client.off(Events.ModuleLoad, refresh));
      for (const watcher of this.watchers.values()) watcher.close();
      this.watchers.clear();
    };
  }
}
