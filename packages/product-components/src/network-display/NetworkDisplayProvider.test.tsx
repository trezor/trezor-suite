import type { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';

import { asNetworkSymbol } from '@trezor/network-module-types';

import type { NetworkDisplayState, NetworkDisplayStore } from './NetworkDisplayConfig';
import { NetworkDisplayProvider, useNetworkOptions } from './NetworkDisplayProvider';

const bitcoin = { symbol: asNetworkSymbol('btc'), name: 'Bitcoin' };
const ethereum = { symbol: asNetworkSymbol('eth'), name: 'Ethereum' };
const staticState: NetworkDisplayState = {
    networks: {
        [bitcoin.symbol]: { name: bitcoin.name },
        [ethereum.symbol]: { name: ethereum.name },
    },
};
const staticStore: NetworkDisplayStore = {
    getState: () => staticState,
    subscribe: () => () => {},
};

describe('NetworkDisplayProvider', () => {
    it('reads all networks from a fixed config store without Redux or selectors', () => {
        const { result, rerender } = renderHook(() => useNetworkOptions(), {
            wrapper: ({ children }: { children: ReactNode }) => (
                <NetworkDisplayProvider store={staticStore}>{children}</NetworkDisplayProvider>
            ),
        });

        expect(result.current).toEqual([bitcoin, ethereum]);
        const snapshot = result.current;
        rerender();
        expect(result.current).toBe(snapshot);
    });

    it('preserves explicit filtering and order, including unknown network symbols', () => {
        const unknown = asNetworkSymbol('unknown');
        const { result, rerender } = renderHook(({ symbols }) => useNetworkOptions(symbols), {
            initialProps: { symbols: [ethereum.symbol, bitcoin.symbol, unknown] },
            wrapper: ({ children }: { children: ReactNode }) => (
                <NetworkDisplayProvider store={staticStore}>{children}</NetworkDisplayProvider>
            ),
        });

        expect(result.current).toEqual([ethereum, bitcoin, { symbol: unknown, name: unknown }]);
        rerender({ symbols: [bitcoin.symbol] });
        expect(result.current).toEqual([bitcoin]);
    });

    it('observes config loading and updates without rerendering for unrelated state', () => {
        let state: NetworkDisplayState & { unrelated: number } = { networks: null, unrelated: 0 };
        const listeners = new Set<() => void>();
        const store: NetworkDisplayStore = {
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
                    <NetworkDisplayProvider store={store}>{children}</NetworkDisplayProvider>
                ),
            },
        );

        expect(result.current).toEqual([]);
        act(() => {
            state = { ...state, ...staticState };
            listeners.forEach(listener => listener());
        });
        expect(result.current).toEqual([bitcoin, ethereum]);

        const snapshot = result.current;
        render.mockClear();
        act(() => {
            state = { ...state, unrelated: 1 };
            listeners.forEach(listener => listener());
        });
        expect(result.current).toBe(snapshot);
        expect(render).not.toHaveBeenCalled();

        act(() => {
            state = { ...state, networks: { [ethereum.symbol]: { name: 'ETH' } } };
            listeners.forEach(listener => listener());
        });
        expect(result.current).toEqual([{ symbol: ethereum.symbol, name: 'ETH' }]);

        unmount();
        expect(listeners.size).toBe(0);
    });
});
