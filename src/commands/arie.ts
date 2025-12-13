import { AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandContainer } from './commands';
import path from 'path';
import fs from 'fs';

const ARIE_DIRECTORY = '_memes';
const ARIE_PATH = path.join(process.cwd(), ARIE_DIRECTORY);

const arieCommand: CommandContainer = {
	data: new SlashCommandBuilder()
        .setName('arie')
        .setDescription('Sends a random Arie meme!'),
    
	async execute(interaction: ChatInputCommandInteraction) {
		const picked = await pickRandomMeme();
        const attachment = new AttachmentBuilder(picked);

        interaction.reply({
            files: [ attachment ]
        });
	},
};

async function pickRandomMeme(): Promise<string> {
    try {
        const files = await fs.readdirSync(ARIE_PATH);

        if (files.length === 0) {
            throw new Error(`No Arie memes found @${ARIE_PATH}`);
        }

        const selected = files[Math.floor(Math.random() * files.length)]!;
        const filePath = path.join(ARIE_PATH, selected);

        return filePath;
    } catch (err) {
        console.error('An error occurred while reading arie memes:', err);
        throw err;
    }
}

export default arieCommand;