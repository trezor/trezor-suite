import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type BackendSettings } from '@suite-common/wallet-types';
import { getBlockchain } from '@suite-common/wallet-utils';

import { type SetBackendPayload, blockchainActions } from './blockchainActions';
import { blockchainInitialState, prepareBlockchainReducer } from './blockchainReducer';

const blockchainReducer = prepareBlockchainReducer(extraDependenciesCommonMock);
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
                const nextState = blockchainReducer(
                    {
                        ...blockchainInitialState,
                        [payload.symbol]: {
                            ...getBlockchain(blockchainInitialState, payload.symbol),
                            backends,
                        },
                    },
                    { type: blockchainActions.setBackend.type, payload },
                );

                expect(getBlockchain(nextState, payload.symbol).backends).toEqual(next);
            });
        });
    });
});
