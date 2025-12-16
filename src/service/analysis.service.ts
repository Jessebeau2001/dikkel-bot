import { analyzeStreamOrThrow, MatchDetail } from '@/api/face-detect.api';
import AnalysisResult from '@/db/models/analysisResult.model';
import axios from 'axios';
import crypto from 'crypto';

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

async function fetchBufferFromUrl(url: string): Promise<{ buffer: Buffer<ArrayBuffer>; hash: string; }> {
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

export async function bufferAnalyzeUrl(url: string): Promise<{
    details: MatchDetail[] | null,
    buffer: Buffer
}> {
    const { buffer, hash } = await fetchBufferFromUrl(url);

    // Look for value in persistent cache
    const cached = await getResult(hash);
    if (cached !== null) return { details: cached.result, buffer };

    // Finally just analyze with the api and cache the result
    const details = await analyzeStreamOrThrow(buffer);
    await saveResult(hash, details);

    return { details, buffer };
}
