import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandContainer } from './commands';
import { updateGuildOptions } from '../service/guildOptions.service';
import { CENSOR_MODES, type CensorMode } from '../db/models/guildOptions.model';

const OPTION_NAME = 'mode';

function capitalize(mode: string): string {
    return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function buildCensorModeChoices() {
    return CENSOR_MODES.map(mode => ({
        name: capitalize(mode),
        value: mode,
    }));
}

function isCensorMode(value: string): value is CensorMode {
  return (CENSOR_MODES as readonly string[]).includes(value);
}

const censorModeCommand: CommandContainer = {
    data: new SlashCommandBuilder()
        .setName('censormode')
        .setDescription('Sets the censor mode for the sever.')
        .addStringOption((option) => option
            .setName(OPTION_NAME)
            .setDescription('The censor mode to apply')
            .setRequired(true)
            .setChoices(buildCensorModeChoices())
        ),
    
    async execute(interaction: ChatInputCommandInteraction) {
        const modeToSet = interaction.options.getString(OPTION_NAME);
        if (!modeToSet) throw new Error('Cannot set mode to nothing, it should be impossible for the user to input this.');
        if (!isCensorMode(modeToSet)) throw new Error(`${modeToSet} is not a valid censor mode, it should be impossible for the user to input this.`);

        const updated = await updateGuildOptions(interaction.guildId!, {
            censorMode: modeToSet
        });

        interaction.reply({
            content: `Set the mode to ${updated.censorMode}`
        });
    }
};

export default censorModeCommand;
