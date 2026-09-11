import { asProtocol } from '@trezor/network-module-suite-common-types';

import { type NetworksRootState, networksActions, networksReducer } from './networksReducer';
import {
    selectNetworkColor,
    selectNetworkSymbolForProtocol,
    selectSupportedNetworkSymbols,
} from './networksSelectors';
import { mockNetworkMetadata } from '../mocks/mockNetworkMetadata';

const bitcoin = mockNetworkMetadata.btc;

const bitcoinState: NetworksRootState = {
    networks: networksReducer(null, networksActions.setNetworks([bitcoin])),
};

const unloadedState: NetworksRootState = { networks: null };

const updatedBitcoinState: NetworksRootState = {
    networks: networksReducer(
        bitcoinState.networks,
        networksActions.setNetworks([
            { ...bitcoin, color: '#ffffff', protocols: [asProtocol('new')] },
        ]),
    ),
};

describe('selectSupportedNetworkSymbols', () => {
    it('returns symbols from the loaded snapshot', () => {
        expect(selectSupportedNetworkSymbols(bitcoinState)).toEqual(['btc']);
    });

    it('returns a stable array for the same snapshot', () => {
        expect(selectSupportedNetworkSymbols({ ...bitcoinState })).toBe(
            selectSupportedNetworkSymbols(bitcoinState),
        );
    });

    it('returns an empty array before networks are loaded', () => {
        expect(selectSupportedNetworkSymbols(unloadedState)).toEqual([]);
        expect(selectSupportedNetworkSymbols({ ...unloadedState })).toBe(
            selectSupportedNetworkSymbols(unloadedState),
        );
    });

    it('updates the symbols when the snapshot changes', () => {
        const emptyState: NetworksRootState = {
            networks: networksReducer(bitcoinState.networks, networksActions.setNetworks([])),
        };

        expect(selectSupportedNetworkSymbols(emptyState)).toEqual([]);
        expect(selectSupportedNetworkSymbols(bitcoinState)).toEqual(['btc']);
    });
});

describe('selectNetworkColor', () => {
    it('reads the color from the current snapshot', () => {
        expect(selectNetworkColor(bitcoinState, 'btc')).toBe('#f29937');
        expect(selectNetworkColor(updatedBitcoinState, 'btc')).toBe('#ffffff');
        expect(selectNetworkColor(bitcoinState, 'btc')).toBe('#f29937');
    });

    it('returns undefined before the modules are loaded', () => {
        expect(selectNetworkColor(unloadedState, 'btc')).toBeUndefined();
    });

    it('returns undefined without a symbol, even before networks are loaded', () => {
        expect(selectNetworkColor(bitcoinState)).toBeUndefined();
        expect(selectNetworkColor(bitcoinState, undefined)).toBeUndefined();
        expect(selectNetworkColor(bitcoinState, null)).toBeUndefined();
        expect(selectNetworkColor(unloadedState)).toBeUndefined();
        expect(selectNetworkColor(unloadedState, undefined)).toBeUndefined();
        expect(selectNetworkColor(unloadedState, null)).toBeUndefined();
    });
});

describe('selectNetworkSymbolForProtocol', () => {
    it('returns null for an undefined protocol before and after networks are loaded', () => {
        expect(selectNetworkSymbolForProtocol(unloadedState, undefined)).toBeNull();
        expect(selectNetworkSymbolForProtocol(bitcoinState, undefined)).toBeNull();
    });

    it('resolves the protocol and its alias from the loaded snapshot', () => {
        expect(selectNetworkSymbolForProtocol(bitcoinState, asProtocol('bitcoin'))).toBe('btc');
        expect(selectNetworkSymbolForProtocol(bitcoinState, asProtocol('btc'))).toBe('btc');
        expect(selectNetworkSymbolForProtocol(bitcoinState, asProtocol('unknown'))).toBeNull();
    });

    it('uses the current snapshot after network protocols change', () => {
        expect(
            selectNetworkSymbolForProtocol(updatedBitcoinState, asProtocol('bitcoin')),
        ).toBeNull();
        expect(selectNetworkSymbolForProtocol(updatedBitcoinState, asProtocol('new'))).toBe('btc');
    });

    it('returns null before the modules are loaded', () => {
        expect(selectNetworkSymbolForProtocol(unloadedState, asProtocol('btc'))).toBeNull();
    });
});
