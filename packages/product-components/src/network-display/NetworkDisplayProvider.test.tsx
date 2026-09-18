import type { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';

import { asNetworkSymbol } from '@trezor/network-module-types';

import type { NetworkDisplayConfig } from './NetworkDisplayConfig';
import {
    NetworkDisplayProvider,
    NetworkDisplayStoreProvider,
    useNetworkOptions,
} from './NetworkDisplayProvider';
import type { ExternalStore } from './useExternalStore';

const bitcoin = { symbol: asNetworkSymbol('btc'), name: 'Bitcoin' };
const ethereum = { symbol: asNetworkSymbol('eth'), name: 'Ethereum' };
const config: NetworkDisplayConfig = {
    networks: [bitcoin.symbol],
    networkNamesMap: { [bitcoin.symbol]: bitcoin.name, [ethereum.symbol]: ethereum.name },
};

// The host's state layout does not belong to product-components.
const selectNetworks = (state: { display: NetworkDisplayConfig }) => state.display.networks;
const selectNetworkNamesMap = (state: { display: NetworkDisplayConfig }) =>
    state.display.networkNamesMap;

describe('NetworkDisplayProvider', () => {
    it('accepts a plain object and supports explicit networks outside the available list', () => {
        const { result, rerender } = renderHook(({ symbols }) => useNetworkOptions(symbols), {
            initialProps: { symbols: [ethereum.symbol, bitcoin.symbol] },
            wrapper: ({ children }: { children: ReactNode }) => (
                <NetworkDisplayProvider value={config}>{children}</NetworkDisplayProvider>
            ),
        });

        expect(result.current).toEqual([ethereum, bitcoin]);
        const snapshot = result.current;
        rerender();
        expect(result.current).toBe(snapshot);
        rerender({ symbols: [bitcoin.symbol] });
        expect(result.current).toEqual([bitcoin]);
    });

    it('falls back to symbols until display names arrive', () => {
        let currentConfig: NetworkDisplayConfig = { ...config, networkNamesMap: null };
        const { result, rerender } = renderHook(() => useNetworkOptions(), {
            wrapper: ({ children }: { children: ReactNode }) => (
                <NetworkDisplayProvider value={currentConfig}>{children}</NetworkDisplayProvider>
            ),
        });
        expect(result.current).toEqual([{ symbol: bitcoin.symbol, name: bitcoin.symbol }]);
        currentConfig = config;
        rerender();
        expect(result.current).toEqual([bitcoin]);
    });

    it('subscribes to selected store values and ignores unrelated state changes', () => {
        let state = { display: config, unrelated: 0 };
        const listeners = new Set<() => void>();
        const store: ExternalStore<typeof state> = {
            getState: () => state,
            subscribe: listener => {
                listeners.add(listener);

                return () => {
                    listeners.delete(listener);
                };
            },
        };
        const render = jest.fn();
        const { result, unmount } = renderHook(
            () => {
                render();

                return useNetworkOptions();
            },
            {
                wrapper: ({ children }: { children: ReactNode }) => (
                    <NetworkDisplayStoreProvider
                        store={store}
                        selectNetworks={selectNetworks}
                        selectNetworkNamesMap={selectNetworkNamesMap}
                    >
                        {children}
                    </NetworkDisplayStoreProvider>
                ),
            },
        );

        expect(result.current).toEqual([bitcoin]);
        const snapshot = result.current;
        render.mockClear();
        act(() => {
            state = { ...state, unrelated: 1 };
            listeners.forEach(listener => listener());
        });
        expect(result.current).toBe(snapshot);
        expect(render).not.toHaveBeenCalled();

        act(() => {
            state = { ...state, display: { ...config, networks: [ethereum.symbol] } };
            listeners.forEach(listener => listener());
        });
        expect(result.current).toEqual([ethereum]);

        act(() => {
            state = {
                ...state,
                display: { ...state.display, networkNamesMap: { [ethereum.symbol]: 'ETH' } },
            };
            listeners.forEach(listener => listener());
        });
        expect(result.current).toEqual([{ symbol: ethereum.symbol, name: 'ETH' }]);

        unmount();
        expect(listeners.size).toBe(0);
    });
});
