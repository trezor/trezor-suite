import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type CustomEvmNetworkDefinition } from '@suite-common/wallet-types';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { explorerActions } from './explorerActions';
import {
    type ExplorerConfig,
    type ExplorerItem,
    explorerInitialState,
    prepareExplorerReducer,
} from './explorerReducer';
import { selectExplorer, selectNetworkExplorerType } from './explorerSelectors';
import { customEvmNetworksActions } from '../customNetworks/customEvmNetworksActions';

const explorerReducer = prepareExplorerReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadExplorer: mockReducer() },
});

const symbol = asNetworkSymbol('evm4242');
const definition: CustomEvmNetworkDefinition = {
    symbol,
    chainId: 4242,
    name: 'Custom Chain',
    displaySymbol: 'CST',
    currencyName: 'Custom Token',
    rpcUrls: ['https://rpc.custom.example'],
    explorerUrl: 'https://explorer.custom.example/',
    testnet: false,
};

// The registry types are closed over the bundled symbols, so a custom symbol is read through an open view.
const asOpenState = (state: ExplorerConfig): Record<string, ExplorerItem | undefined> => state;

const toRootState = (explorer: ExplorerConfig) => ({ wallet: { explorer } });

describe('explorer reducer custom EVM networks', () => {
    it('seeds the default explorer from the definition in the shape of the built-in ones', () => {
        const state = explorerReducer(
            explorerInitialState,
            customEvmNetworksActions.registered({ definition }),
        );

        expect(asOpenState(state)[symbol]).toEqual({
            default: {
                base: 'https://explorer.custom.example',
                tx: 'tx',
                address: 'address',
                nft: 'nft',
                token: undefined,
                contract: undefined,
                queryString: undefined,
            },
            custom: undefined,
        });
        expect(Object.keys(asOpenState(state)[symbol]?.default ?? {}).sort()).toEqual(
            Object.keys(explorerInitialState.eth.default).sort(),
        );
    });

    it('keeps a custom explorer set by the user when registered again', () => {
        const registered = explorerReducer(
            explorerInitialState,
            customEvmNetworksActions.registered({ definition }),
        );
        const customized = explorerReducer(
            registered,
            explorerActions.setExplorer({
                symbol,
                explorer: { base: 'https://other.example', tx: 'transaction', address: 'address' },
            }),
        );

        const state = explorerReducer(
            customized,
            customEvmNetworksActions.registered({ definition }),
        );

        expect(asOpenState(state)[symbol]?.custom?.base).toBe('https://other.example');
    });

    it('removes the entry of an unregistered network', () => {
        const registered = explorerReducer(
            explorerInitialState,
            customEvmNetworksActions.registered({ definition }),
        );

        const state = explorerReducer(
            registered,
            customEvmNetworksActions.unregistered({ symbol }),
        );

        expect(asOpenState(state)[symbol]).toBeUndefined();
    });

    it('selectors tolerate a network without an entry', () => {
        const state = toRootState(explorerInitialState);

        expect(selectExplorer(state, symbol)).toBeUndefined();
        expect(selectNetworkExplorerType(state, symbol)).toBe('default');
    });
});
