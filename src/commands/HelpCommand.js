import { EmbedBuilder } from '../builders/EmbedBuilder.js';
import { Colors } from '../util/Constants.js';

/**
 * The built-in /help: every command grouped by category, or the details of one.
 * Turn it on with `new Client({ commands: { help: true } })`, or `help: { name, color, title }`.
 */
export function createHelpCommand(handler, { name = 'help', color = Colors.Yapin, title = 'Commands', aliases = [] } = {}) {
  const listGroup = (commands, prefix) => {
    const value = commands.map((c) => `\`${prefix}${c.name}\` ${c.description}`).join('\n');
    return value.length > 1024 ? `${value.slice(0, 1020)}…` : value;
  };
  return {
    name,
    aliases,
    description: 'List the commands, or explain one',
    category: 'Help',
    options: [{ name: 'command', description: 'A command or category to explain', rest: true }],
    run(ctx) {
      const prefix = ctx.prefix.startsWith('<@') ? '/' : ctx.prefix;
      const wanted = ctx.values.command?.replace(/^[/!]/, '').trim();
      const groups = new Map();
      for (const command of handler.registry.values()) {
        if (command.hidden) continue;
        const group = command.category ?? 'Other';
        if (!groups.has(group)) groups.set(group, []);
        groups.get(group).push(command);
      }
      if (wanted) {
        const words = wanted.split(/\s+/);
        let command = handler.get(words.shift());
        while (command && words.length) command = command.findSubcommand(words.shift()) ?? command;
        if (!command || command.hidden) {
          const group = [...groups.keys()].find((g) => g.toLowerCase() === wanted.toLowerCase());
          if (!group) return ctx.reply(`There's no \`${prefix}${wanted}\` command.`);
          const embed = new EmbedBuilder().setColor(color).setTitle(group).setDescription(listGroup(groups.get(group), prefix))
            .setFooter({ text: `${prefix}${name} <command> for details` });
          return ctx.reply({ embeds: [embed] });
        }
        const embed = new EmbedBuilder().setColor(color).setTitle(`${prefix}${command.path}`).setDescription(command.description || 'No description.');
        embed.addFields({ name: 'Usage', value: `\`${command.usage(prefix)}\`` });
        if (command.aliases.length) embed.addFields({ name: 'Aliases', value: command.aliases.map((a) => `\`${a}\``).join(', '), inline: true });
        if (command.cooldown) embed.addFields({ name: 'Cooldown', value: `${command.cooldown.duration / 1000}s`, inline: true });
        const options = command.options.filter((o) => o.description);
        if (options.length) embed.addFields({ name: 'Options', value: options.map((o) => `\`${o.name}\` ${o.description}`).join('\n').slice(0, 1024) });
        if (command.subcommands.size) {
          embed.addFields({ name: 'Subcommands', value: command.subcommands.map((s) => `\`${s.name}\` ${s.description}`).join('\n').slice(0, 1024) });
        }
        if (command.examples.length) embed.addFields({ name: 'Examples', value: command.examples.map((e) => `\`${e}\``).join('\n').slice(0, 1024) });
        return ctx.reply({ embeds: [embed] });
      }
      const embed = new EmbedBuilder().setColor(color).setTitle(title)
        .setFooter({ text: `${prefix}${name} <command> for details` });
      // An embed holds 10 fields: past that, the last field names the other categories.
      const sorted = [...groups].sort(([a], [b]) => a.localeCompare(b));
      const shown = sorted.length > 10 ? sorted.slice(0, 9) : sorted;
      for (const [group, commands] of shown) embed.addFields({ name: group, value: listGroup(commands, prefix) });
      if (shown.length < sorted.length) {
        const more = sorted.slice(shown.length).map(([group]) => `\`${group}\``).join(', ');
        const value = `${more.length > 900 ? `${more.slice(0, 900)}…` : more}\n\`${prefix}${name} <category>\` to list one`;
        embed.addFields({ name: 'More categories', value });
      }
      if (!groups.size) embed.setDescription('No commands yet.');
      return ctx.reply({ embeds: [embed] });
    },
  };
}
