import { type LegacyNetworkSymbol } from '@suite-common/legacy-network-config';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type BackendSettings,
    type Blockchain,
    type BlockchainNetworks,
    type CustomEvmNetworkDefinition,
} from '@suite-common/wallet-types';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { type SetBackendPayload, blockchainActions } from './blockchainActions';
import { blockchainInitialState, prepareBlockchainReducer } from './blockchainReducer';
import { customEvmNetworksActions } from '../customNetworks/customEvmNetworksActions';

const blockchainReducer = prepareBlockchainReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadBlockchain: mockReducer() },
});
const btcSymbol = asNetworkSymbol('btc');

const urls = ['http://a, http://b, http://c'];

type BlockchainFixture = [string, BackendSettings, SetBackendPayload, BackendSettings];

const fixtures: BlockchainFixture[] = [
    ['try to set empty', {}, { symbol: btcSymbol, type: 'electrum', urls: [] }, {}],
    [
        'set custom',
        {},
        { symbol: btcSymbol, type: 'electrum', urls },
        { selected: 'electrum', urls: { electrum: urls } },
    ],
    [
        'change custom',
        { selected: 'electrum', urls: { electrum: urls } },
        { symbol: btcSymbol, type: 'blockbook', urls },
        { selected: 'blockbook', urls: { electrum: urls, blockbook: urls } },
    ],
    [
        'reset with remembering',
        { selected: 'blockbook', urls: { electrum: urls, blockbook: urls } },
        { symbol: btcSymbol, type: 'default' },
        { urls: { electrum: urls, blockbook: urls } },
    ],
    [
        'reset with forgetting',
        { selected: 'electrum', urls: { electrum: urls, blockbook: urls } },
        { symbol: btcSymbol, type: 'electrum', urls: [] },
        { urls: { blockbook: urls } },
    ],
];

describe('blockchain reducer', () => {
    describe('blockchain set backend', () => {
        fixtures.forEach(([description, backends, payload, next]) => {
            it(description, () => {
                expect(
                    blockchainReducer(
                        {
                            ...blockchainInitialState,
                            [payload.symbol as LegacyNetworkSymbol]: {
                                ...blockchainInitialState[payload.symbol as LegacyNetworkSymbol],
                                backends,
                            },
                        },
                        { type: blockchainActions.setBackend.type, payload },
                    )[payload.symbol as LegacyNetworkSymbol].backends,
                ).toEqual(next);
            });
        });
    });
});

// The registry types are closed over the bundled symbols, so a custom symbol is read through an open view.
const asOpenState = (state: BlockchainNetworks): Record<string, Blockchain | undefined> => state;

describe('blockchain reducer custom EVM networks', () => {
    const symbol = asNetworkSymbol('evm4242');
    const definition: CustomEvmNetworkDefinition = {
        symbol,
        chainId: 4242,
        name: 'Custom Chain',
        displaySymbol: 'CST',
        currencyName: 'Custom Token',
        rpcUrls: ['https://rpc.custom.example'],
        explorerUrl: 'https://explorer.custom.example',
        testnet: false,
    };

    it('seeds a registered network like a built-in one without a preset backend', () => {
        const state = blockchainReducer(
            blockchainInitialState,
            customEvmNetworksActions.registered({ definition }),
        );

        expect(asOpenState(state)[symbol]).toEqual({
            connected: false,
            blockHash: '0',
            blockHeight: 0,
            version: '0',
            backends: {},
        });
    });

    it('keeps the existing entry when the network is registered again', () => {
        const registered = blockchainReducer(
            blockchainInitialState,
            customEvmNetworksActions.registered({ definition }),
        );
        const connected = {
            ...registered,
            [symbol]: { ...asOpenState(registered)[symbol], connected: true },
        };

        const state = blockchainReducer(
            connected,
            customEvmNetworksActions.registered({ definition }),
        );

        expect(asOpenState(state)[symbol]?.connected).toBe(true);
    });

    it('removes the entry of an unregistered network', () => {
        const registered = blockchainReducer(
            blockchainInitialState,
            customEvmNetworksActions.registered({ definition }),
        );

        const state = blockchainReducer(
            registered,
            customEvmNetworksActions.unregistered({ symbol }),
        );

        expect(asOpenState(state)[symbol]).toBeUndefined();
        expect(state.btc).toEqual(blockchainInitialState.btc);
    });
});
