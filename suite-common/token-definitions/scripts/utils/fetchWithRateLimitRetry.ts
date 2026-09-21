import {
    RATE_LIMIT_BASE_DELAY_MS,
    RATE_LIMIT_MAX_DELAY_MS,
    RATE_LIMIT_MAX_RETRIES,
} from '../constants';

const HTTP_TOO_MANY_REQUESTS = 429;

export class RateLimitError extends Error {
    constructor(url: string) {
        super(`Rate limit exceeded for ${url} after ${RATE_LIMIT_MAX_RETRIES} retries`);
        this.name = 'RateLimitError';
    }
}

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const getRetryDelayMs = (response: Response, attempt: number) => {
    const retryAfterSeconds = Number(response.headers.get('retry-after'));
    const delayMs =
        Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
            ? retryAfterSeconds * 1000
            : RATE_LIMIT_BASE_DELAY_MS * 2 ** attempt;

    return Math.min(delayMs, RATE_LIMIT_MAX_DELAY_MS);
};

export const fetchWithRateLimitRetry = async (url: string): Promise<Response> => {
    let attempt = 0;

    while (true) {
        const response = await fetch(url);

        if (response.status !== HTTP_TOO_MANY_REQUESTS) {
            return response;
        }

        if (attempt >= RATE_LIMIT_MAX_RETRIES) {
            throw new RateLimitError(url);
        }

        await response.body?.cancel();

        const delayMs = getRetryDelayMs(response, attempt);
        console.warn(
            `Rate limited by ${url}, retrying in ${delayMs} ms (${attempt + 1}/${RATE_LIMIT_MAX_RETRIES})`,
        );
        await sleep(delayMs);
        attempt++;
    }
};
