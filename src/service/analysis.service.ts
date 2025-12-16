import { analyzeStreamOrThrow, ApiResponse, MatchDetail, analyzeUrl as apiAnalyzeUrl } from '@/api/face-detect.api';
import AnalysisResult from '@/db/models/analysisResult.model';
import axios from 'axios';
import crypto from 'crypto';
import { Message } from 'discord.js';
import { isImageContentType } from './discord-helper';

async function getResult(hash: string): Promise<AnalysisResult | null> {
    return await AnalysisResult.findByHash(hash);
}

async function saveResult(hash: string, details: MatchDetail[] | null): Promise<void> {
    await AnalysisResult.upsert({
        contentHash: hash,
        result: details,
        analyzerVersion: 'dev'
    });
}

async function fetchAndHashBufferFromUrl(url: string): Promise<{ buffer: Buffer<ArrayBuffer>; hash: string; }> {
    let response;

    try {
        response = await axios.get<ArrayBuffer>(url, { responseType: 'arraybuffer' });
    } catch (err) {
        throw new Error('An error occurred while fetching url', { cause: err });
    }

    if (response.status !== 200) {
        throw new Error(`Failed to fetch from the url: ${response.statusText}`);
    }

    const buffer = Buffer.from(response.data);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    return { buffer, hash };
}

const ARIE_THRESHOLD = 0.6;

export const isDetailMatch = (name: string, threshold: number = ARIE_THRESHOLD) => (match: MatchDetail) => {
	return match.name === name && match.distance < threshold;
};

export async function analyzeUrl(url: string[] | string): Promise<ApiResponse> {
    let body = url;
    if (Array.isArray(body)) {
        body = body.join(';');
    }
    return await apiAnalyzeUrl(body);
}

export async function bufferAnalyzeUrl(url: string): Promise<{
    details: MatchDetail[] | null,
    buffer: Buffer
}> {
    const { buffer, hash } = await fetchAndHashBufferFromUrl(url);

    // Look for value in persistent cache
    const cached = await getResult(hash);
    if (cached !== null) return { details: cached.result, buffer };

    // Finally just analyze with the api and cache the result
    const details = await analyzeStreamOrThrow(buffer);
    await saveResult(hash, details);

    return { details, buffer };
}

export async function analyzeMessage(message: Message): Promise<ApiResponse> {
    const urls = message.attachments
        .filter(attachment => isImageContentType(attachment.contentType))
        .map(attachment => attachment.url);

    return await analyzeUrl(urls);
}

// ===== Legacy Helpers =====
export function getMatchingEntries(
	response: ApiResponse,
	name: string = 'arie_pasma',
	threshold: number = ARIE_THRESHOLD
): Record<string, MatchDetail[]> {
    const result: Record<string, MatchDetail[]> = {};

    for (const [url, entry] of Object.entries(response)) {
        // Filter matches inside each entry
        if ('matches' in entry) {
            const filteredMatches = entry.matches.filter(isDetailMatch(name, threshold));
            if (filteredMatches.length > 0) {
                result[url] = filteredMatches;
            }
        }
    }

    return result;
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
