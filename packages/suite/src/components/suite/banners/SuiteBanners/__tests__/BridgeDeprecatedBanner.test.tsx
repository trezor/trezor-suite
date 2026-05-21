import '@suite-common/test-utils/src/globalOverrides';

import { act, renderHook, waitFor } from '@testing-library/react';

import { isWeb } from '@trezor/env-utils';

jest.mock('@suite/intl', () => ({
    Translation: ({ id }: any) => id,
}));

jest.mock('@suite/router', () => ({
    goto: () => ({ type: 'goto' }),
}));

jest.mock('src/hooks/suite', () => ({
    useDispatch: () => () => {},
}));

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isWeb: jest.fn(() => false),
}));

jest.mock('src/hooks/suite/useLocalNetworkAccessPermission', () => ({
    useLocalNetworkAccessPermission: jest.fn(() => ({ localNetworkAccessPermission: 'unknown' })),
}));

import { useLocalNetworkAccessPermission } from 'src/hooks/suite/useLocalNetworkAccessPermission';

import { useLegacyBridgeDetection } from '../BridgeDeprecatedBanner';

const mockIsWeb = isWeb as jest.MockedFunction<typeof isWeb>;
const mockUseLna = useLocalNetworkAccessPermission as jest.MockedFunction<
    typeof useLocalNetworkAccessPermission
>;

describe('useLegacyBridgeDetection', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        mockIsWeb.mockReset().mockReturnValue(false);
        mockUseLna.mockReset().mockReturnValue({ localNetworkAccessPermission: 'unknown' });
    });

    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    it('returns false initially', () => {
        global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;

        const { result } = renderHook(() => useLegacyBridgeDetection());

        expect(result.current).toBe(false);
    });

    it('returns true when legacy bridge responds with version', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ version: '2.0.33' }),
            }),
        ) as jest.Mock;

        const { result } = renderHook(() => useLegacyBridgeDetection());

        await waitFor(() => expect(result.current).toBe(true));
    });

    it('stays false when response is not ok', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ version: '2.0.33' }),
            }),
        ) as jest.Mock;

        const { result } = renderHook(() => useLegacyBridgeDetection());

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(result.current).toBe(false);
    });

    it('stays false when response has no version', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({}),
            }),
        ) as jest.Mock;

        const { result } = renderHook(() => useLegacyBridgeDetection());

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(result.current).toBe(false);
    });

    it('stays false when response is from a 3.x bridge (custom port scenario)', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ version: '3.2.1' }),
            }),
        ) as jest.Mock;

        const { result } = renderHook(() => useLegacyBridgeDetection());

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(result.current).toBe(false);
    });

    it('stays false when an unrelated service reports a non-2.x version on port 21325', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ version: '5.0.1' }),
            }),
        ) as jest.Mock;

        const { result } = renderHook(() => useLegacyBridgeDetection());

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(result.current).toBe(false);
    });

    it('stays false when version is not a string', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ version: 2 }),
            }),
        ) as jest.Mock;

        const { result } = renderHook(() => useLegacyBridgeDetection());

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(result.current).toBe(false);
    });

    it('stays false on network error', async () => {
        global.fetch = jest.fn(() => Promise.reject(new Error('network error'))) as jest.Mock;

        const { result } = renderHook(() => useLegacyBridgeDetection());

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(result.current).toBe(false);
    });

    it('aborts the fetch on unmount', () => {
        const abortSpy = jest.spyOn(AbortController.prototype, 'abort');
        global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;

        const { unmount } = renderHook(() => useLegacyBridgeDetection());

        unmount();
        expect(abortSpy).toHaveBeenCalled();
    });

    describe('on web', () => {
        beforeEach(() => {
            mockIsWeb.mockReturnValue(true);
        });

        it('does not probe when LNA permission is unknown', () => {
            const fetchMock = jest.fn(() => new Promise(() => {})) as jest.Mock;
            global.fetch = fetchMock;
            mockUseLna.mockReturnValue({ localNetworkAccessPermission: 'unknown' });

            const { result } = renderHook(() => useLegacyBridgeDetection());

            expect(fetchMock).not.toHaveBeenCalled();
            expect(result.current).toBe(false);
        });

        it('does not probe when LNA permission is denied', () => {
            const fetchMock = jest.fn(() => new Promise(() => {})) as jest.Mock;
            global.fetch = fetchMock;
            mockUseLna.mockReturnValue({ localNetworkAccessPermission: 'denied' });

            const { result } = renderHook(() => useLegacyBridgeDetection());

            expect(fetchMock).not.toHaveBeenCalled();
            expect(result.current).toBe(false);
        });

        it('does not probe when LNA permission is prompt', () => {
            const fetchMock = jest.fn(() => new Promise(() => {})) as jest.Mock;
            global.fetch = fetchMock;
            mockUseLna.mockReturnValue({ localNetworkAccessPermission: 'prompt' });

            const { result } = renderHook(() => useLegacyBridgeDetection());

            expect(fetchMock).not.toHaveBeenCalled();
            expect(result.current).toBe(false);
        });

        it('probes when LNA permission is granted', async () => {
            const fetchMock = jest.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ version: '2.0.33' }),
                }),
            ) as jest.Mock;
            global.fetch = fetchMock;
            mockUseLna.mockReturnValue({ localNetworkAccessPermission: 'granted' });

            const { result } = renderHook(() => useLegacyBridgeDetection());

            await waitFor(() => expect(result.current).toBe(true));
            expect(fetchMock).toHaveBeenCalledWith(
                'http://127.0.0.1:21325/',
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('starts probing after permission transitions from denied to granted', async () => {
            const fetchMock = jest.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ version: '2.0.33' }),
                }),
            ) as jest.Mock;
            global.fetch = fetchMock;
            mockUseLna.mockReturnValue({ localNetworkAccessPermission: 'denied' });

            const { result, rerender } = renderHook(() => useLegacyBridgeDetection());

            expect(fetchMock).not.toHaveBeenCalled();

            mockUseLna.mockReturnValue({ localNetworkAccessPermission: 'granted' });
            rerender();

            await waitFor(() => expect(result.current).toBe(true));
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
    });
});
