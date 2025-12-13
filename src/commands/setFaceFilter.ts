import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandContainer } from './commands';


const setFaceFilterCommand: CommandContainer = {
	data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
    
	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.reply('Pong!');
	},
};

export default setFaceFilterCommand;