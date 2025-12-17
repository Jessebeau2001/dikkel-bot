import { AttachmentBuilder, Client, Events, GatewayIntentBits, Message } from 'discord.js';
import { Jimp } from 'jimp';
import { areaToRect } from './lib/jimp-helper';
import { getEnvString } from './lib/utils';
import { chatInputCommandRouter } from './commands/commands';
import { getGuildOptions } from './service/guildOptions.service';
import { MatchDetail } from './api/face-detect.api';
import { bufferAnalyzeUrl, isDetailMatch } from './service/analysis.service';
import { isImageContentType } from './service/discord-helper';
import { CensorMode } from './db/models/guildOptions.model';
import { drawEllipses } from './plugins/ellipse';
import { pixelateRect } from './plugins/blur';

const DISCORD_TOKEN = getEnvString('DISCORD_TOKEN');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	]
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

async function createCensoredAttachment(
	details: MatchDetail[],
	buffer: Buffer,
	mode: Exclude<CensorMode, 'none'>
) {
	const areas = details.map(detail => areaToRect(detail.location));
	const image = await Jimp.read(buffer);
	
	const RED = 0xFF0000FF;

	switch (mode) {
		case 'select':
			await drawEllipses(image, areas, RED);
			break;
		case 'blur':
			await pixelateRect(image, areas);
			break;
	}

	const replyBuffer = await image.getBuffer('image/png');
	return new AttachmentBuilder(replyBuffer, {
		name: 'the_arie.png'
	});
}

const messageArieFilterCached = async (message: Message) => {
	if (message.author.bot) return;
	if (message.attachments.size === 0) return;
	if (message.guildId === null) return;

	const options = await getGuildOptions(message.guildId);
	if(options === null || options.censorMode === null || options.censorMode === 'none') return;

	const urls = getAttachmentUrls(message);
	const replyAttachments: AttachmentBuilder[] = [];

	for (const url of urls) {
		const { details, buffer } = await bufferAnalyzeUrl(url);
		const onlyArie = details !== null ? details.filter(isDetailMatch('arie_pasma')) : [];
		if (onlyArie.length > 0) {
			const attach = await createCensoredAttachment(onlyArie, buffer, options.censorMode);
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
