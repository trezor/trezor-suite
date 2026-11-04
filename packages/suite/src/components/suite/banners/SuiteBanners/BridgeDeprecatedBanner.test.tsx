import '@suite-common/test-utils/globalOverrides';

import { type PropsWithChildren } from 'react';

import { act, renderHook, waitFor } from '@testing-library/react';

import { type DesktopApi, type DesktopApiDep } from '@suite/desktop-app-api';
import { ServicesProvider } from '@trezor/dependency-injection';
import { isWeb } from '@trezor/env-utils';

jest.mock('@suite/intl', () => ({
    Translation: ({ id }: any) => id,
}));

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isWeb: jest.fn(() => false),
}));

jest.mock('src/hooks/suite/useLocalNetworkAccessPermission', () => ({
    useLocalNetworkAccessPermission: jest.fn(() => ({ localNetworkAccessPermission: 'unknown' })),
}));

import { useLocalNetworkAccessPermission } from 'src/hooks/suite/useLocalNetworkAccessPermission';

import { useLegacyBridgeDetection } from './BridgeDeprecatedBanner';

const mockIsWeb = isWeb as jest.MockedFunction<typeof isWeb>;
const mockUseLna = useLocalNetworkAccessPermission as jest.MockedFunction<
    typeof useLocalNetworkAccessPermission
>;

type IsLegacyBridgeRunning = DesktopApi['isLegacyBridgeRunning'];

const renderUseLegacyBridgeDetection = (
    isLegacyBridgeRunning: IsLegacyBridgeRunning = () => new Promise(() => {}),
) => {
    const services: DesktopApiDep<'isLegacyBridgeRunning'> = {
        desktopApi: { isLegacyBridgeRunning },
    };
    const wrapper = ({ children }: PropsWithChildren) => (
        <ServicesProvider services={services}>{children}</ServicesProvider>
    );

    return renderHook(() => useLegacyBridgeDetection(), { wrapper });
};

describe('useLegacyBridgeDetection', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        mockIsWeb.mockReset().mockReturnValue(true);
        mockUseLna.mockReset().mockReturnValue({ localNetworkAccessPermission: 'granted' });
    });

    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    it('returns false initially', () => {
        global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;

        const { result } = renderUseLegacyBridgeDetection();

        expect(result.current).toBe(false);
    });

    it('returns true when legacy bridge responds with version', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ version: '2.0.33' }),
            }),
        ) as jest.Mock;

        const { result } = renderUseLegacyBridgeDetection();

        await waitFor(() => expect(result.current).toBe(true));
    });

    it('stays false when response is not ok', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ version: '2.0.33' }),
            }),
        ) as jest.Mock;

        const { result } = renderUseLegacyBridgeDetection();

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

        const { result } = renderUseLegacyBridgeDetection();

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

        const { result } = renderUseLegacyBridgeDetection();

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

        const { result } = renderUseLegacyBridgeDetection();

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

        const { result } = renderUseLegacyBridgeDetection();

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(result.current).toBe(false);
    });

    it('stays false on network error', async () => {
        global.fetch = jest.fn(() => Promise.reject(new Error('network error'))) as jest.Mock;

        const { result } = renderUseLegacyBridgeDetection();

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(result.current).toBe(false);
    });

    it('aborts the fetch on unmount', () => {
        const abortSpy = jest.spyOn(AbortController.prototype, 'abort');
        global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;

        const { unmount } = renderUseLegacyBridgeDetection();

        unmount();
        expect(abortSpy).toHaveBeenCalled();
    });

    describe('on web', () => {
        it('does not probe when LNA permission is unknown', () => {
            const fetchMock = jest.fn(() => new Promise(() => {})) as jest.Mock;
            global.fetch = fetchMock;
            mockUseLna.mockReturnValue({ localNetworkAccessPermission: 'unknown' });

            const { result } = renderUseLegacyBridgeDetection();

            expect(fetchMock).not.toHaveBeenCalled();
            expect(result.current).toBe(false);
        });

        it('does not probe when LNA permission is denied', () => {
            const fetchMock = jest.fn(() => new Promise(() => {})) as jest.Mock;
            global.fetch = fetchMock;
            mockUseLna.mockReturnValue({ localNetworkAccessPermission: 'denied' });

            const { result } = renderUseLegacyBridgeDetection();

            expect(fetchMock).not.toHaveBeenCalled();
            expect(result.current).toBe(false);
        });

        it('does not probe when LNA permission is prompt', () => {
            const fetchMock = jest.fn(() => new Promise(() => {})) as jest.Mock;
            global.fetch = fetchMock;
            mockUseLna.mockReturnValue({ localNetworkAccessPermission: 'prompt' });

            const { result } = renderUseLegacyBridgeDetection();

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

            const { result } = renderUseLegacyBridgeDetection();

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

            const { result, rerender } = renderUseLegacyBridgeDetection();

            expect(fetchMock).not.toHaveBeenCalled();

            mockUseLna.mockReturnValue({ localNetworkAccessPermission: 'granted' });
            rerender();

            await waitFor(() => expect(result.current).toBe(true));
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('on desktop', () => {
        beforeEach(() => {
            mockIsWeb.mockReturnValue(false);
            mockUseLna.mockReturnValue({ localNetworkAccessPermission: 'unknown' });
        });

        it('returns true when main process detects legacy bridge', async () => {
            const fetchMock = jest.fn() as jest.Mock;
            global.fetch = fetchMock;
            const isLegacyBridgeRunning = jest.fn<ReturnType<IsLegacyBridgeRunning>, []>(() =>
                Promise.resolve({ success: true, payload: true }),
            );

            const { result } = renderUseLegacyBridgeDetection(isLegacyBridgeRunning);

            await waitFor(() => expect(result.current).toBe(true));
            expect(isLegacyBridgeRunning).toHaveBeenCalledTimes(1);
            // The renderer runs from `file://`, which trezord-go rejects.
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('stays false when main process does not detect legacy bridge', async () => {
            const { result } = renderUseLegacyBridgeDetection(() =>
                Promise.resolve({ success: true, payload: false }),
            );

            await act(async () => {
                await Promise.resolve();
            });
            expect(result.current).toBe(false);
        });

        it('stays false when IPC call fails', async () => {
            const { result } = renderUseLegacyBridgeDetection(() =>
                Promise.resolve({ success: false, error: 'error' }),
            );

            await act(async () => {
                await Promise.resolve();
            });
            expect(result.current).toBe(false);
        });

        it('ignores result after unmount', async () => {
            let resolveProbe: (
                value: Awaited<ReturnType<IsLegacyBridgeRunning>>,
            ) => void = () => {};
            const { result, unmount } = renderUseLegacyBridgeDetection(
                () =>
                    new Promise(resolve => {
                        resolveProbe = resolve;
                    }),
            );

            unmount();
            await act(async () => {
                resolveProbe({ success: true, payload: true });
                await Promise.resolve();
            });
            expect(result.current).toBe(false);
        });
    });
});
