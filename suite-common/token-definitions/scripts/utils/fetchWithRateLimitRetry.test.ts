import {
    RATE_LIMIT_BASE_DELAY_MS,
    RATE_LIMIT_MAX_DELAY_MS,
    RATE_LIMIT_MAX_RETRIES,
} from '../constants';
import { RateLimitError, fetchWithRateLimitRetry } from './fetchWithRateLimitRetry';

const url = 'https://api.stellar.expert/explorer/public/contract/CCW67TSZ';

const rateLimited = (headers?: Record<string, string>) =>
    new Response(null, { status: 429, headers });
const ok = () => new Response('{}', { status: 200 });

const totalBackoffMs = Array.from(
    { length: RATE_LIMIT_MAX_RETRIES },
    (_, attempt) => RATE_LIMIT_BASE_DELAY_MS * 2 ** attempt,
).reduce((sum, delay) => sum + delay, 0);

describe('fetchWithRateLimitRetry', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('returns the first non-429 response without waiting', async () => {
        const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(ok());

        const response = await fetchWithRateLimitRetry(url);

        expect(response.status).toBe(200);
        expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('retries after the Retry-After delay', async () => {
        const fetchSpy = jest
            .spyOn(global, 'fetch')
            .mockResolvedValueOnce(rateLimited({ 'retry-after': '2' }))
            .mockResolvedValueOnce(ok());

        const promise = fetchWithRateLimitRetry(url);
        await jest.advanceTimersByTimeAsync(1999);
        expect(fetchSpy).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(1);
        const response = await promise;

        expect(response.status).toBe(200);
        expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('caps an excessive Retry-After delay', async () => {
        const fetchSpy = jest
            .spyOn(global, 'fetch')
            .mockResolvedValueOnce(rateLimited({ 'retry-after': '86400' }))
            .mockResolvedValueOnce(ok());

        const promise = fetchWithRateLimitRetry(url);
        await jest.advanceTimersByTimeAsync(RATE_LIMIT_MAX_DELAY_MS);
        const response = await promise;

        expect(response.status).toBe(200);
        expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('falls back to exponential backoff without Retry-After', async () => {
        const fetchSpy = jest
            .spyOn(global, 'fetch')
            .mockResolvedValueOnce(rateLimited())
            .mockResolvedValueOnce(rateLimited())
            .mockResolvedValueOnce(ok());

        const promise = fetchWithRateLimitRetry(url);
        await jest.advanceTimersByTimeAsync(RATE_LIMIT_BASE_DELAY_MS);
        expect(fetchSpy).toHaveBeenCalledTimes(2);

        await jest.advanceTimersByTimeAsync(RATE_LIMIT_BASE_DELAY_MS * 2);
        const response = await promise;

        expect(response.status).toBe(200);
        expect(fetchSpy).toHaveBeenCalledTimes(3);
    });

    it('throws RateLimitError once retries are exhausted', async () => {
        const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(rateLimited());

        const promise = fetchWithRateLimitRetry(url);
        promise.catch(() => undefined);
        await jest.advanceTimersByTimeAsync(totalBackoffMs);

        await expect(promise).rejects.toThrow(RateLimitError);

        expect(fetchSpy).toHaveBeenCalledTimes(RATE_LIMIT_MAX_RETRIES + 1);
    });
});
