import { createMockDeps } from '@trezor/dependency-injection';

import { type ReferralApiFetchDeps, createReferralApiFetch } from './createReferralApiFetch';
import { getReferralKeyFromCipheredValue, getReferralPublicKey } from '../referralKey';

const referralKey = getReferralKeyFromCipheredValue(
    '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
);

const createJsonResponse = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });

const createDeps = (response: Response | Error, baseUrl = 'https://example.com/referral') =>
    createMockDeps<ReferralApiFetchDeps>({
        getReferAFriendApiUrl: () => baseUrl,
        fetch: () =>
            response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
    });

describe(createReferralApiFetch.name, () => {
    beforeEach(() => {
        jest.useFakeTimers({ now: 1_700_000_000_123 });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('fetches the public program without authorization', async () => {
        const deps = createDeps(createJsonResponse(200, { rewardAmount: 20 }));

        const result = await createReferralApiFetch(deps)({
            method: 'GET',
            endpoint: 'v1/program',
        });

        expect(result).toEqual({ success: true, payload: { rewardAmount: 20 } });
        expect(deps.fetch).toHaveBeenCalledWith('https://example.com/referral/v1/program', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            body: null,
        });
    });

    it('signs requests with the full path and sends an empty JSON body for POST', async () => {
        const deps = createDeps(createJsonResponse(200, { status: 'active' }));

        await createReferralApiFetch(deps)({
            method: 'POST',
            endpoint: 'v1/account/leave',
            referralKey,
        });

        const [url, init] = deps.fetch.mock.calls[0] ?? [];
        const authorization = (init?.headers as Record<string, string>).Authorization;

        expect(url).toBe('https://example.com/referral/v1/account/leave');
        expect(init?.body).toBe('{}');
        expect(authorization).toMatch(
            new RegExp(
                `^Referral v1; pubkey="${getReferralPublicKey(referralKey)}"; ts="1700000000"; sig="[0-9a-f]{128}"$`,
            ),
        );
    });

    it('returns the API error code', async () => {
        const deps = createDeps(createJsonResponse(401, { error: 'timestampExpired' }));

        const result = await createReferralApiFetch(deps)({
            method: 'GET',
            endpoint: 'v1/vouchers',
            referralKey,
        });

        expect(result).toEqual({
            success: false,
            error: { type: 'ApiError', code: 'timestampExpired', httpStatus: 401 },
        });
    });

    it('returns a null code for an unknown error body', async () => {
        const deps = createDeps(new Response('Bad gateway', { status: 502 }));

        const result = await createReferralApiFetch(deps)({
            method: 'GET',
            endpoint: 'v1/program',
        });

        expect(result).toEqual({
            success: false,
            error: { type: 'ApiError', code: null, httpStatus: 502 },
        });
    });

    it('returns a fetch error when the request fails', async () => {
        const deps = createDeps(new Error('Network down'));

        const result = await createReferralApiFetch(deps)({
            method: 'GET',
            endpoint: 'v1/program',
        });

        expect(result).toEqual({
            success: false,
            error: { type: 'FetchError', message: 'Network down' },
        });
    });

    it('returns a fetch error for an invalid custom URL', async () => {
        const deps = createDeps(createJsonResponse(200, {}), 'not a url');

        const result = await createReferralApiFetch(deps)({
            method: 'GET',
            endpoint: 'v1/program',
        });

        expect(!result.success && result.error.type).toBe('FetchError');
        expect(deps.fetch).not.toHaveBeenCalled();
    });
});
