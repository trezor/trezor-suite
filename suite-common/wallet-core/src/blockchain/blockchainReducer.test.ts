import { networksActions } from '@suite-common/networks';
import { mockNetworkConfigDeps } from '@suite-common/networks/mocks';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type BackendSettings } from '@suite-common/wallet-types';

import { type SetBackendPayload, blockchainActions } from './blockchainActions';
import { createBlockchainInitialState, prepareBlockchainReducer } from './blockchainReducer';

const networkConfigDeps = mockNetworkConfigDeps();

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
                            ...createBlockchainInitialState(networkConfigDeps.getNetworkConfigs()),
                            [payload.symbol]: {
                                ...createBlockchainInitialState(
                                    networkConfigDeps.getNetworkConfigs(),
                                )[payload.symbol],
                                backends,
                            },
                        },
                        { type: blockchainActions.setBackend.type, payload },
                    )[payload.symbol].backends,
                ).toEqual(next);
            });
        });
    });
});

it('initializes only loaded networks and preserves custom backends on reload', () => {
    const bitcoin = networkConfigDeps.getNetworkConfig('btc');
    const loaded = blockchainReducer(undefined, networksActions.setNetworks([bitcoin]));
    expect(Object.keys(loaded)).toEqual(['btc']);
    expect(loaded.btc.connected).toBe(false);

    const configured = blockchainReducer(
        loaded,
        blockchainActions.setBackend({
            symbol: bitcoin.symbol,
            type: 'electrum',
            urls: ['https://custom.example'],
        }),
    );
    const reloaded = blockchainReducer(configured, networksActions.setNetworks([bitcoin]));
    expect(reloaded.btc.backends).toEqual(configured.btc.backends);
});
