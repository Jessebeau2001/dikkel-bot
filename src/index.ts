import { AttachmentBuilder, Client, Events, GatewayIntentBits, Message } from 'discord.js';
import { getMatchingEntries, analyzeMessage, fetchBufferFromUrl, detailOf } from './service/face-detect.service';
import { Jimp } from 'jimp';
import { applyEllipsesToImage } from './service/jimp-helper';
import { getEnvString } from './envHelper';
import { chatInputCommandRouter } from './commands/commands';
import { getGuildOptions } from './service/guildOptions.service';
import AnalysisResult from './db/models/analysisResult.model';
import { MatchDetail } from './api/face-detect.api';
import { bufferAnalyzeUrl } from './service/analysis.service';

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

/**
 * This is what content types can look like
 * image/jpeg, image/webp, video/mp4, image/svg+xml; charset=utf-8
 */
function isImageMime(mimeType: string | null): boolean {
	if (!mimeType) return false;
	const type = mimeType.split('/')[0];
	return type === 'image';
}

function getAttachmentUrls(message: Message): string[] {
	return message.attachments
		.filter(attachment => isImageMime(attachment.contentType))
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
		const onlyArie = details !== null ? details.filter(detailOf('arie_pasma')) : [];
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
}
client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.ShardError, (error) => {
	console.error('A http error occurred during api call:', error);
});

client.on(Events.MessageCreate, messageArieFilterCached);
client.on(Events.InteractionCreate, chatInputCommandRouter);

client.login(DISCORD_TOKEN);

// AnalysisResult.create({
// 	result: { michael: 'isOokDik' },
// 	contentHash: crypto.randomUUID()
// });

(async () => {
	const found = await AnalysisResult.findByPk('d04cc7a2-9dcc-485c-ae18-be81dbd40347');
	if (found !== null) {
		console.log(found.get({ plain: true }));
		console.log(found.result);
	}
})();