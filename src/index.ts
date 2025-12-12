import { AttachmentBuilder, Client, Events, GatewayIntentBits, Message } from 'discord.js';
import { getMatchingEntries, analyzeMessage, fetchBufferFromUrl } from './service/face-detect.service';
import { Jimp } from 'jimp';
import { applyEllipsesToImage } from './service/jimp-helper';

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

client.on(Events.MessageCreate, 
	messageArieFilter
);

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

if (DISCORD_TOKEN) {
	client.login(process.env.DISCORD_TOKEN);
} else {
	console.error('No Discord token provided. Cannot start app without it, quitting...');
}
