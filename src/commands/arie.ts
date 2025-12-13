import { AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandContainer } from './commands';
import path from 'path';
import fs from 'fs';

const ARIE_PATH = evalPath(process.env.ARIE_MEMES_DIR ?? 'arie_memes');

function evalPath(str: string) {
    if (path.isAbsolute(str)) {
        return str;
    } else {
        return path.resolve(process.cwd(), str);
    }
}

const arieCommand: CommandContainer = {
	data: new SlashCommandBuilder()
        .setName('arie')
        .setDescription('Sends a random Arie meme!'),
    
	async execute(interaction: ChatInputCommandInteraction) {
        try {
            const picked = await pickRandomMeme();
            const attachment = new AttachmentBuilder(picked);
            interaction.reply({
                files: [ attachment ]
            });
        } catch (err) {
            interaction.reply({
                content: 'WAT ARIE PASMA OHKE!'
            });
            throw new Error('An error occurred while reading arie memes', { cause: err });
        }
	},
};

// Returns an absolute path
async function pickRandomMeme(): Promise<string> {
    if (ARIE_PATH === undefined) {
        throw new Error('No Arie memes folder configured');
    }
    const files = await fs.readdirSync(ARIE_PATH);

    if (files.length === 0) {
        throw new Error(`No Arie memes found in dir @${ARIE_PATH}`);
    }

    const selected = files[Math.floor(Math.random() * files.length)]!;
    const filePath = path.join(ARIE_PATH, selected);

    return filePath;
}

export default arieCommand;