import { Message, OmitPartialGroupDMChannel } from 'discord.js';

/**
 * This is what content types can look like
 * 'image/jpeg'
 * 'image/webp'
 * 'video/mp4'
 * 'image/svg+xml; charset=utf-8'
 */
export function isImageContentType(contentType: string | null): boolean {
	if (!contentType) return false;
	const type = contentType.split('/')[0];
	return type === 'image';
}

export function getUrlsFromMessage(message: OmitPartialGroupDMChannel<Message<boolean>>): string[] {
    return message.attachments
        .filter(attachment => isImageContentType(attachment.contentType))
        .map(attachment => attachment.url);
}

export type Handler = (message: Message) => void;

export type Middleware = (next: Handler) => Handler;

export const requireNonBot: Middleware = (next) => (message) => {
    if (!message.author.bot) {
        next(message);
    }
};

export const requireAttachment: Middleware = (next) => (message) => {
    if (message.attachments.size > 0) {
        next(message);
    }
};