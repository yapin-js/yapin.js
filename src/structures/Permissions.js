import { PermissionFlags } from '../util/Constants.js';

const normalize = (name) => String(name).toLowerCase().replace(/[^a-z]/g, '');

/**
 * What a role (or a member, through all their roles) may do. Names match loosely:
 * 'manage_messages', 'ManageMessages' and PermissionFlags.ManageMessages are the same.
 * The server owner has every permission.
 */
export class Permissions {
  constructor(names = [], { all = false } = {}) {
    this.all = all;
    this.set = new Set([...names].map(normalize));
  }

  static fromRole(role) {
    const names = [];
    if (role.manageServer) names.push('manage_server');
    if (role.manageMessages) names.push('manage_messages');
    for (const [key, value] of Object.entries(role.perms ?? {})) if (value) names.push(key);
    return new Permissions(names);
  }

  static fromRoles(roles, { owner = false } = {}) {
    const names = [];
    for (const role of roles) names.push(...Permissions.fromRole(role).set);
    return new Permissions(names, { all: owner });
  }

  /** True when every permission given is held. */
  has(...permissions) {
    if (this.all) return true;
    return permissions.flat().every((p) => this.set.has(normalize(p)));
  }

  any(...permissions) {
    if (this.all) return true;
    return permissions.flat().some((p) => this.set.has(normalize(p)));
  }

  missing(...permissions) {
    if (this.all) return [];
    return permissions.flat().filter((p) => !this.set.has(normalize(p)));
  }

  /** The held names, normalised. With `all` (the server owner), every PermissionFlags name too. */
  toArray() {
    if (this.all) return [...new Set([...Object.values(PermissionFlags).map(normalize), ...this.set])];
    return [...this.set];
  }

  toJSON() {
    return this.all ? ['*'] : this.toArray();
  }
}
