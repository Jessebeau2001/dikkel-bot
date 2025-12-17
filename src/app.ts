import { AttachmentBuilder, Client, Events, GatewayIntentBits, Message } from 'discord.js';
import { Jimp } from 'jimp';
import { applyEllipsesToImage } from './service/jimp-helper';
import { getEnvString } from './lib/utils';
import { chatInputCommandRouter } from './commands/commands';
import { getGuildOptions } from './service/guildOptions.service';
import { MatchDetail } from './api/face-detect.api';
import { analyzeMessage, bufferAnalyzeUrl, fetchBufferFromUrl, getMatchingEntries, isDetailMatch } from './service/analysis.service';
import { isImageContentType } from './service/discord-helper';

const DISCORD_TOKEN = getEnvString('DISCORD_TOKEN');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	]
});

async function isCensorEnabledInGuild(message: Message): Promise<boolean> {
	const guildId = message.guildId;
	if (guildId === null) return false;

	const options = await getGuildOptions(guildId);
	return options !== null && options.censorMode !== 'none';
}

function getAttachmentUrls(message: Message): string[] {
	return message.attachments
		.filter(attachment => isImageContentType(attachment.contentType))
		.map(attachment => attachment.url);
}

async function createMarkedAttachment(details: MatchDetail[], buffer: Buffer) {
	const bounds = details.map(detail => detail.location);
	const image = await Jimp.read(buffer);
	
	const RED = 0xFF0000FF;
	applyEllipsesToImage(image, bounds, RED);

	const replyBuffer = await image.getBuffer('image/png');
	return new AttachmentBuilder(replyBuffer, {
		name: 'the_arie.png'
	});
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const messageArieFilter = async (message: Message) => {
	if (message.author.bot) return;
	if (message.attachments.size === 0) return;
	if(!await isCensorEnabledInGuild(message)) return;
	
	const response = await analyzeMessage(message);
	const arieMatches = getMatchingEntries(response, 'arie_pasma');

	if (Object.values(arieMatches).length === 0) return;

	const replyAttachments = [];
	for (const [url, details] of Object.entries(arieMatches)) {
		const buffer = await fetchBufferFromUrl(url);
		const attach = await createMarkedAttachment(details, buffer);
		replyAttachments.push(attach);
	}

	await message.reply({
		content: 'Godverdomme, das Arie!',
		files: replyAttachments
	});
};

const messageArieFilterCached = async (message: Message) => {
	if (message.author.bot) return;
	if (message.attachments.size === 0) return;
	if(!await isCensorEnabledInGuild(message)) return;

	const urls = getAttachmentUrls(message);
	const replyAttachments: AttachmentBuilder[] = [];

	for (const url of urls) {
		const { details, buffer } = await bufferAnalyzeUrl(url);
		const onlyArie = details !== null ? details.filter(isDetailMatch('arie_pasma')) : [];
		if (onlyArie.length > 0) {
			const attach = await createMarkedAttachment(onlyArie, buffer);
			replyAttachments.push(attach);
		}
	}

	if (replyAttachments.length > 0) {
		await message.reply({
			content: 'Godverdomme, das Arie!',
			files: replyAttachments
		});
	}
};

client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.ShardError, (error) => {
	console.error('A http error occurred during api call:', error);
});

client.on(Events.MessageCreate, messageArieFilterCached);
client.on(Events.InteractionCreate, chatInputCommandRouter);

client.login(DISCORD_TOKEN);
