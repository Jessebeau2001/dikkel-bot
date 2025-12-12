/* eslint-disable camelcase */
import * as z from 'zod';

const HOST = initEnvKey('FACE_API_HOST', 'localhost');
const PORT = initEnvKey('FACE_API_PORT', 5000);
const URL = `http://${HOST}:${PORT}`;

console.log(`pylw-api configured at ${URL}`);
testConnection();

function initEnvKey<T extends string | number | boolean>(
    key: string,
    fallback: T
): T {
    const raw = process.env[key];

    if (raw === undefined) {
        console.log(`Env ${key} was omitted, defaulting to value '${fallback}'`);
        return fallback;
    }

    if (typeof fallback === 'number') {
        const parsed = Number(raw);
        if (isNaN(parsed)) {
            console.warn(`Env ${key}='${raw}' is not a valid number. Defaulting to value ${fallback}`);
            return fallback;
        }
        return parsed as T;
    }

    if (typeof fallback === 'boolean') {
        const lower = raw.toLowerCase();
        if (lower === 'true') return true as T;
        if (lower === 'false') return false as T;
        console.warn(`Env ${key}='${raw}' is not a valid boolean. Defaulting to value ${fallback}`);
        return fallback;
    }

    // String is default case
    return raw as T;
}

const Health = z.object({
    status: z.string(),
    timestamp: z.string(),
    uptime: z.string()
});

const MatchDetailSchema = z.object({
  name: z.string(),
  distance: z.number(),
  location: z.tuple([z.number(), z.number(), z.number(), z.number()]),
});

const SuccessEntrySchema = z.object({
  matches: z.array(MatchDetailSchema),
  duration_ms: z.number(),
});

const ErrorEntrySchema = z.object({
  error: z.string(),
});

const EntrySchema = z.union([SuccessEntrySchema, ErrorEntrySchema]);

const ApiResponseSchema = z.record(z.string(), EntrySchema);

export type MatchDetail = z.infer<typeof MatchDetailSchema>;
export type SuccessEntry = z.infer<typeof SuccessEntrySchema>;
export type ErrorEntry = z.infer<typeof ErrorEntrySchema>;
export type ApiResponse = z.infer<typeof ApiResponseSchema>;

export function isSuccess(entry: SuccessEntry | ErrorEntry): entry is SuccessEntry {
    return 'matches' in entry;
}

export function getSuccessEntries(response: ApiResponse): Record<string, SuccessEntry> {
    const result: Record<string, SuccessEntry> = {};
    for (const [url, entry] of Object.entries(response)) {
        if ('matches' in entry) {
            result[url] = entry;
        }
    }
    return result;
}

async function requireOk(response: Response): Promise<void> {
    if (!response.ok) {
        const text = await response.text();
        throw new Error(
            `API replied with an unexpected status: ${response.status}, message: ${text}`
        );
    }
}

export async function analyzeUrl(payload: string): Promise<ApiResponse> {
    const response = await fetch(`${URL}/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: payload
    });

    await requireOk(response);
    const json = await response.json();
    return ApiResponseSchema.parse(json);
}

export async function fetchHealth() {
    const response = await fetch(`${URL}/health`);
    const body = await response.json();
    return Health.parse(body);
}

export async function testConnection() {
    try {
        const health = await fetchHealth();
        if (health.status.toLowerCase() === 'ok') {
            console.log('Successfully established connection with API:', health);
        } else {
            console.log('The API replied with an unhealthy status:', health);
        }
    } catch (err) {
        console.error('pylw-api connection check failed:');
        console.error(err);
    }
}
