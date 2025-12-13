import { CacheType, ChatInputCommandInteraction, Interaction, MessageFlags, REST, Routes, SharedSlashCommand } from 'discord.js';
import { DISCORD_APP_ID, DISCORD_TOKEN } from '..';
import setFaceFilterCommand from './setFaceFilter';
import arieCommand from './arie';
import censorModeCommand from './censorMode';

const ERROR_MESSAGE = 'There was an unexpected error while executing this command!';
const COMMAND_REGISTRY = new Map<string, CommandContainer>();
const COMMANDS = [
    setFaceFilterCommand,
    arieCommand,
    censorModeCommand
];

initCommands(COMMANDS);

export interface CommandContainer {
    data: SharedSlashCommand,
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export async function deployAllAppCommands(): Promise<void> {
    await deployApplicationCommands(COMMANDS);
}

export async function deployApplicationCommands(commands: CommandContainer[]): Promise<void> {
	const rest = new REST().setToken(DISCORD_TOKEN);
    
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        
        const body = commands.map(cmd => cmd.data.toJSON());
        const data = await rest.put(Routes.applicationCommands(DISCORD_APP_ID), { body });

        if (Array.isArray(data)) {
            console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        } else {
            console.error('Discord replied with an unexpected response while updating commands');
        }
    } catch (error) {
        console.error(error);
    }
}

function initCommands(commands: CommandContainer | CommandContainer[]) {
    const _commands = Array.isArray(commands) ? commands : [ commands ];
    _commands.forEach(cmd => {
        COMMAND_REGISTRY.set(cmd.data.name, cmd);
    });
}

function getCommand(name: string): CommandContainer | undefined {
    return COMMAND_REGISTRY.get(name);
}

async function contextAwareReply(interaction: ChatInputCommandInteraction<CacheType>, message: string): Promise<void> {
    if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
            content: message,
            flags: MessageFlags.Ephemeral,
        });
    } else {
        await interaction.reply({
            content: message,
            flags: MessageFlags.Ephemeral,
        });
    }
}

export const chatInputCommandRouter = async (interaction: Interaction) => {
	if (!interaction.isChatInputCommand()) return;

    const command = getCommand(interaction.commandName);
    if (command === undefined) {
        console.error(`Received command with no matching handler: /${interaction.commandName}`);
        await contextAwareReply(interaction, ERROR_MESSAGE);
		return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`An unexpected error occurred while handling command /${interaction.commandName}:`, error);
        // await contextAwareReply(interaction, ERROR_MESSAGE);
    }
};