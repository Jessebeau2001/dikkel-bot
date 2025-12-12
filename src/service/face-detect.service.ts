import { Attachment, Collection, Message } from 'discord.js';
import { ApiResponse, ErrorEntry, MatchDetail, analyzeUrl as apiAnalyzeUrl, SuccessEntry } from '../api/face-detect.api';
import axios from 'axios';


const ARIE_THRESHOLD = 0.6;

/**
 * This is what content types can look like
 * 'image/jpeg'
 * 'image/webp'
 * 'video/mp4'
 * 'image/svg+xml; charset=utf-8'
 */
function isImageContentType(mimeType: string | null): boolean {
	if (!mimeType) return false;
	const type = mimeType.split('/')[0];
	return type === 'image';
}

export function iterateResponse(
    response: ApiResponse,
    onSuccess: (url: string, entry: SuccessEntry) => void,
    onError?: (url: string, entry: ErrorEntry) => void
) {
    for (const [url, entry] of Object.entries(response)) {
        if ('matches' in entry) {
            onSuccess(url, entry);
        } else {
            onError?.(url, entry);
        }
    }
}

export async function analyzeAttachments(attachments: Collection<string, Attachment>): Promise<ApiResponse> {
	const urls = attachments
        .filter(attachment => isImageContentType(attachment.contentType))
        .map(attachment => attachment.url);

	return await analyzeUrl(urls);
}

export function getMatchingEntries(
	response: ApiResponse,
	name: string = 'arie_pasma',
	threshold: number = ARIE_THRESHOLD
): Record<string, MatchDetail[]> {
  const result: Record<string, MatchDetail[]> = {};

  for (const [url, entry] of Object.entries(response)) {
    // Filter matches inside each entry
	if ('matches' in entry) {
		const filteredMatches = entry.matches.filter(match => match.name === name && match.distance < threshold);
		if (filteredMatches.length > 0) {
			result[url] = filteredMatches;
		}
	}
  }

  return result;
}

export async function analyzeUrl(url: string[] | string): Promise<ApiResponse> {
	let body = url;
    if (Array.isArray(body)) {
		body = body.join(';');
	}
    return await apiAnalyzeUrl(body);
}

export async function analyzeMessage(message: Message): Promise<ApiResponse> {
	const urls = message.attachments
        .filter(attachment => isImageContentType(attachment.contentType))
        .map(attachment => attachment.url);

	return await analyzeUrl(urls);
}

export async function fetchBufferFromUrl(url: string) {
	const response = await axios.get(
		url,
		{ responseType: 'arraybuffer' }
	);

	if (response.status === 200) {
		return response.data;
	} else {
		throw new Error(`Failed to fetch from the url: ${response.statusText}`);
	}
}
