import { captureException, withScope } from '@sentry/core';

import type { EARN_API_BASE_URL } from '@suite-common/earn-staking-api';

import type { reportTronStakeTxId } from './reportTronStakeTxId';

jest.mock('@sentry/core', () => ({ captureException: jest.fn(), withScope: jest.fn() }));

const TXID = 'a'.repeat(64);

const withScopeMock = withScope as jest.Mock;
const captureExceptionMock = jest.mocked(captureException);
const scope = { setTag: jest.fn(), setExtra: jest.fn() };

let fetchSpy: jest.SpiedFunction<typeof fetch>;
let reportBaseUrl: typeof EARN_API_BASE_URL;
let report: typeof reportTronStakeTxId;

// `createHttpClient` captures `globalThis.fetch` when the Earn API module is evaluated, so the
// spy has to exist before the helper and its dependency tree are loaded.
beforeAll(async () => {
    fetchSpy = jest.spyOn(globalThis, 'fetch');
    ({ EARN_API_BASE_URL: reportBaseUrl } = await import('@suite-common/earn-staking-api'));
    ({ reportTronStakeTxId: report } = await import('./reportTronStakeTxId'));
});

beforeEach(() => {
    jest.clearAllMocks();
    withScopeMock.mockImplementation(callback => callback(scope));
});

const respondWithStatus = (status: number) =>
    fetchSpy.mockResolvedValueOnce(new Response('{}', { status }));

const respondWithStatusZero = () =>
    fetchSpy.mockResolvedValueOnce(
        Object.defineProperties(new Response('{}'), {
            status: { value: 0 },
            ok: { value: false },
        }),
    );

const expectReportFailureCaptured = () => {
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    expect(scope.setTag).toHaveBeenCalledWith('error.code', 'tron_staking_txid_report_failed');
    expect(scope.setTag).toHaveBeenCalledWith('error.kind', 'vote');
};

describe('reportTronStakeTxId', () => {
    it('posts the txid to the report endpoint and resolves true on HTTP 200', async () => {
        respondWithStatus(200);

        await expect(report(TXID, 'vote')).resolves.toBe(true);

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        const request = fetchSpy.mock.calls[0]?.[0] as Request;
        expect(request.method).toBe('POST');
        expect(request.url).toBe(`${reportBaseUrl}/report`);
        await expect(request.json()).resolves.toEqual({
            txid: TXID,
            network: 'tron',
            kind: 'vote',
        });
        expect(captureExceptionMock).not.toHaveBeenCalled();
    });

    it('resolves false and captures a Sentry event on HTTP 503', async () => {
        respondWithStatus(503);

        await expect(report(TXID, 'vote')).resolves.toBe(false);

        expectReportFailureCaptured();
        expect(scope.setExtra).toHaveBeenCalledWith('errorMessage', expect.stringContaining('503'));
    });

    it('resolves false on response status 0 instead of treating it as success', async () => {
        respondWithStatusZero();

        await expect(report(TXID, 'vote')).resolves.toBe(false);

        expectReportFailureCaptured();
    });

    it('resolves false on timeout', async () => {
        fetchSpy.mockRejectedValueOnce(
            Object.assign(new Error('The operation was aborted due to timeout'), {
                name: 'TimeoutError',
            }),
        );

        await expect(report(TXID, 'vote')).resolves.toBe(false);

        expectReportFailureCaptured();
        expect(scope.setExtra).toHaveBeenCalledWith(
            'errorMessage',
            'The operation was aborted due to timeout',
        );
    });

    it('resolves false on network error', async () => {
        fetchSpy.mockRejectedValueOnce(new TypeError('fetch failed'));

        await expect(report(TXID, 'vote')).resolves.toBe(false);

        expectReportFailureCaptured();
        expect(scope.setExtra).toHaveBeenCalledWith('errorMessage', 'fetch failed');
    });
});
