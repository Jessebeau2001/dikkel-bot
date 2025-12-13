import { AttachmentBuilder, Client, Events, GatewayIntentBits, Message } from 'discord.js';
import { getMatchingEntries, analyzeMessage, fetchBufferFromUrl } from './service/face-detect.service';
import { Jimp } from 'jimp';
import { applyEllipsesToImage } from './service/jimp-helper';
import { migrate } from './db';
import { getEnvString } from './envHelper';
import { chatInputCommandRouter, deployAllAppCommands } from './commands/commands';

export const DISCORD_TOKEN = getEnvString('DISCORD_TOKEN');
export const DISCORD_APP_ID = getEnvString('DISCORD_APP_ID');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	]
});

const messageArieFilter = async (message: Message) => {
	if (message.author.bot) return;
	if (message.attachments.size === 0) return;
	
	const response = await analyzeMessage(message);
	const arieMatches = getMatchingEntries(response, 'arie_pasma');

	if (Object.values(arieMatches).length === 0) return;

	const replyAttachments = [];
	for (const [url, details] of Object.entries(arieMatches)) {
		const bounds = details.map(detail => detail.location);
		const buffer = await fetchBufferFromUrl(url);
		const image = await Jimp.read(buffer);
		
		const RED = 0xFF0000FF;
		applyEllipsesToImage(image, bounds, RED);

		const replyBuffer = await image.getBuffer('image/png');
		replyAttachments.push(new AttachmentBuilder(
			replyBuffer, { name: 'the_arie.png' }
		));
	}

	await message.reply({
		content: 'Godverdomme, das Arie!',
		files: replyAttachments
	});
};

client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, messageArieFilter);
client.on(Events.InteractionCreate, chatInputCommandRouter);

(async () => {
	if (process.env.NODE_ENV === 'dev') {
		await migrate();
		// await deployAllAppCommands();
	};
	client.login(DISCORD_TOKEN);
})();

