import { type ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useModuleLoader } from './useModuleLoader';

type Payload = { type: 'needs-chunk' | 'already-here'; id: number };

type Loader = (() => Promise<unknown>) | undefined;

const setup = (getLoader: (key: Payload['type']) => Loader, retries = 0) => {
    const queryClient = new QueryClient();
    const onLoaded = jest.fn();
    const onError = jest.fn();

    const rendered = renderHook(
        () =>
            useModuleLoader({
                toKey: (payload: Payload) => payload.type,
                getLoader,
                onLoaded,
                onError,
                retries,
            }),
        {
            wrapper: ({ children }: { children: ReactNode }) => (
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            ),
        },
    );

    return { ...rendered, onLoaded, onError };
};

describe(useModuleLoader.name, () => {
    it('runs onLoaded in the same commit when there is nothing to fetch', () => {
        const { result, onLoaded } = setup(() => undefined);

        act(() => result.current.load({ type: 'already-here', id: 1 }));

        expect(onLoaded).toHaveBeenCalledWith({ type: 'already-here', id: 1 });
        expect(result.current.isLoading).toBe(false);
    });

    it('waits for the module, reporting isLoading, before running onLoaded', async () => {
        let release: () => void = () => {};
        const loader = jest.fn(
            () =>
                new Promise<void>(resolve => {
                    release = resolve;
                }),
        );
        const { result, onLoaded } = setup(() => loader);

        act(() => result.current.load({ type: 'needs-chunk', id: 2 }));

        await waitFor(() => expect(result.current.isLoading).toBe(true));
        expect(onLoaded).not.toHaveBeenCalled();

        act(() => release());

        await waitFor(() => expect(onLoaded).toHaveBeenCalledWith({ type: 'needs-chunk', id: 2 }));
        expect(loader).toHaveBeenCalledTimes(1);
    });

    it('reports a module that never arrives instead of throwing it at a boundary', async () => {
        const { result, onLoaded, onError } = setup(
            () => () => Promise.reject(new Error('Loading chunk 123 failed.')),
        );

        act(() => result.current.load({ type: 'needs-chunk', id: 3 }));

        await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
        expect(onError.mock.calls[0][0]).toEqual(new Error('Loading chunk 123 failed.'));
        expect(onLoaded).not.toHaveBeenCalled();
    });

    it('does not run onLoaded when the caller unmounted before the module arrived', async () => {
        let release: () => void = () => {};
        const loader = jest.fn(
            () =>
                new Promise<void>(resolve => {
                    release = resolve;
                }),
        );
        const { result, unmount, onLoaded, onError } = setup(() => loader);

        act(() => result.current.load({ type: 'needs-chunk', id: 6 }));
        await waitFor(() => expect(result.current.isLoading).toBe(true));

        unmount();
        act(() => release());
        await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));

        expect(onLoaded).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
    });

    it('does not run onError when the caller unmounted before the module failed', async () => {
        let reject: (error: Error) => void = () => {};
        const { result, unmount, onLoaded, onError } = setup(
            () => () =>
                new Promise<void>((_, rejectPromise) => {
                    reject = rejectPromise;
                }),
        );

        act(() => result.current.load({ type: 'needs-chunk', id: 7 }));
        await waitFor(() => expect(result.current.isLoading).toBe(true));

        unmount();
        act(() => reject(new Error('Loading chunk 123 failed.')));
        await act(async () => {
            await Promise.resolve();
        });

        expect(onError).not.toHaveBeenCalled();
        expect(onLoaded).not.toHaveBeenCalled();
    });

    it('keeps load and preload stable across renders', () => {
        const { result, rerender } = setup(() => undefined);
        const first = { load: result.current.load, preload: result.current.preload };

        rerender();

        expect(result.current.load).toBe(first.load);
        expect(result.current.preload).toBe(first.preload);
    });

    it('swallows a failed preload, leaving no unhandled rejection', async () => {
        const unhandled = jest.fn();
        process.on('unhandledRejection', unhandled);
        const { result } = setup(() => () => Promise.reject(new Error('offline')));

        act(() => result.current.preload('needs-chunk'));
        await new Promise(resolve => {
            setTimeout(resolve, 0);
        });

        process.off('unhandledRejection', unhandled);
        expect(unhandled).not.toHaveBeenCalled();
    });
});
