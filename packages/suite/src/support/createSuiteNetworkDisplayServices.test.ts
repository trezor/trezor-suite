import { getMockNetworkMetadata } from '@suite-common/networks/mocks/mockNetworkMetadata';
import { initialWalletSettingsState } from '@suite-common/wallet-core/src/settings/walletSettingsReducer';

import {
    type SuiteNetworkDisplayServicesDeps,
    createSuiteNetworkDisplayServices,
} from './createSuiteNetworkDisplayServices';

const bitcoin = getMockNetworkMetadata('btc');
const ethereum = getMockNetworkMetadata('eth');

describe('createSuiteNetworkDisplayServices', () => {
    it('tracks enabled networks and names while preserving snapshots for unrelated changes', () => {
        let state: ReturnType<SuiteNetworkDisplayServicesDeps['getState']> = {
            networks: { [bitcoin.symbol]: bitcoin, [ethereum.symbol]: ethereum },
            wallet: {
                settings: { ...initialWalletSettingsState, enabledNetworks: [bitcoin.symbol] },
            },
        };
        const listeners = new Set<() => void>();
        const deps: SuiteNetworkDisplayServicesDeps = {
            getState: () => state,
            subscribe: listener => {
                listeners.add(listener);

                return () => {
                    listeners.delete(listener);
                };
            },
        };
        const services = createSuiteNetworkDisplayServices(deps);
        const source = services.getNetworks();
        const first = source.getSnapshot();

        expect(first).toEqual([{ symbol: bitcoin.symbol, name: bitcoin.name }]);
        expect(source.getSnapshot()).toBe(first);
        state = {
            ...state,
            wallet: { settings: { ...state.wallet.settings, localCurrency: 'eur' } },
        };
        expect(source.getSnapshot()).toBe(first);

        const onChange = jest.fn();
        const unsubscribe = source.subscribe(onChange);
        state = {
            ...state,
            wallet: { settings: { ...state.wallet.settings, enabledNetworks: [ethereum.symbol] } },
        };
        listeners.forEach(listener => listener());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(source.getSnapshot()).toEqual([{ symbol: ethereum.symbol, name: ethereum.name }]);

        state = {
            ...state,
            networks: { [ethereum.symbol]: { ...ethereum, name: 'Updated name' } },
        };
        expect(source.getSnapshot()).toEqual([{ symbol: ethereum.symbol, name: 'Updated name' }]);
        unsubscribe();
        expect(listeners.size).toBe(0);
    });

    it('allows an explicit protocol network before names load and even when it is not enabled', () => {
        let state: ReturnType<SuiteNetworkDisplayServicesDeps['getState']> = {
            networks: null,
            wallet: {
                settings: { ...initialWalletSettingsState, enabledNetworks: [bitcoin.symbol] },
            },
        };
        const deps: SuiteNetworkDisplayServicesDeps = {
            getState: () => state,
            subscribe: () => () => {},
        };
        const source = createSuiteNetworkDisplayServices(deps).getNetworks([ethereum.symbol]);

        expect(source.getSnapshot()).toEqual([{ symbol: ethereum.symbol, name: ethereum.symbol }]);
        state = { ...state, networks: { [ethereum.symbol]: ethereum } };
        expect(source.getSnapshot()).toEqual([{ symbol: ethereum.symbol, name: ethereum.name }]);
    });
});
