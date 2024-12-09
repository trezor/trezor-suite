import { BackendSettings } from '@suite-common/wallet-types';
import { extraDependenciesMock } from '@suite-common/test-utils';

import { blockchainInitialState, prepareBlockchainReducer } from '../blockchainReducer';
import { blockchainActions, SetBackendPayload } from '../blockchainActions';

const blockchainReducer = prepareBlockchainReducer(extraDependenciesMock);

const urls = ['http://a, http://b, http://c'];

type BlockchainFixture = [string, BackendSettings, SetBackendPayload, BackendSettings];

const fixtures: BlockchainFixture[] = [
    ['try to set empty', {}, { symbol: 'btc', type: 'electrum', urls: [] }, {}],
    [
        'set custom',
        {},
        { symbol: 'btc', type: 'electrum', urls },
        { selected: 'electrum', urls: { electrum: urls } },
    ],
    [
        'change custom',
        { selected: 'electrum', urls: { electrum: urls } },
        { symbol: 'btc', type: 'blockbook', urls },
        { selected: 'blockbook', urls: { electrum: urls, blockbook: urls } },
    ],
    [
        'reset with remembering',
        { selected: 'blockbook', urls: { electrum: urls, blockbook: urls } },
        { symbol: 'btc', type: 'default' },
        { urls: { electrum: urls, blockbook: urls } },
    ],
    [
        'reset with forgetting',
        { selected: 'electrum', urls: { electrum: urls, blockbook: urls } },
        { symbol: 'btc', type: 'electrum', urls: [] },
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
                            [payload.symbol]: {
                                ...blockchainInitialState[payload.symbol],
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
