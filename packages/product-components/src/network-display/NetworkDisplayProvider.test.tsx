import type { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';

import { asNetworkSymbol } from '@trezor/network-module-types';

import { NetworkDisplayProvider, useNetworkOptions } from './NetworkDisplayProvider';
import type { NetworkDisplayServices, NetworkOption } from './NetworkDisplayServices';
import { createStaticNetworkDisplayServices } from './createStaticNetworkDisplayServices';

const bitcoin = { symbol: asNetworkSymbol('btc'), name: 'Bitcoin' };
const ethereum = { symbol: asNetworkSymbol('eth'), name: 'Ethereum' };

describe('NetworkDisplayProvider', () => {
    it('supplies static networks without an application store', () => {
        const networks = [bitcoin, ethereum];
        const services = createStaticNetworkDisplayServices({ networks });
        const { result, rerender } = renderHook(() => useNetworkOptions(), {
            wrapper: ({ children }: { children: ReactNode }) => (
                <NetworkDisplayProvider services={services}>{children}</NetworkDisplayProvider>
            ),
        });

        expect(result.current).toBe(networks);
        rerender();
        expect(result.current).toBe(networks);
    });

    it('preserves the explicit order and updates when the requested networks change', () => {
        const services = createStaticNetworkDisplayServices({ networks: [bitcoin, ethereum] });
        const { result, rerender } = renderHook(({ symbols }) => useNetworkOptions(symbols), {
            initialProps: { symbols: [ethereum.symbol, bitcoin.symbol] },
            wrapper: ({ children }: { children: ReactNode }) => (
                <NetworkDisplayProvider services={services}>{children}</NetworkDisplayProvider>
            ),
        });

        expect(result.current).toEqual([ethereum, bitcoin]);
        rerender({ symbols: [bitcoin.symbol] });
        expect(result.current).toEqual([bitcoin]);
    });

    it('reacts to service notifications and unsubscribes on unmount', () => {
        let networks: readonly NetworkOption[] = [bitcoin];
        const listeners = new Set<() => void>();
        const services: NetworkDisplayServices = {
            getNetworks: () => ({
                getSnapshot: () => networks,
                subscribe: listener => {
                    listeners.add(listener);

                    return () => {
                        listeners.delete(listener);
                    };
                },
            }),
        };
        const { result, unmount } = renderHook(() => useNetworkOptions(), {
            wrapper: ({ children }: { children: ReactNode }) => (
                <NetworkDisplayProvider services={services}>{children}</NetworkDisplayProvider>
            ),
        });

        expect(result.current).toEqual([bitcoin]);
        act(() => {
            networks = [ethereum];
            listeners.forEach(listener => listener());
        });
        expect(result.current).toEqual([ethereum]);

        unmount();
        expect(listeners.size).toBe(0);
    });
});
