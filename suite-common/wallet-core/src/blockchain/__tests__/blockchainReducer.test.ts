import { BackendSettings } from '@suite-common/wallet-types';
import { extraDependenciesMock } from '@suite-common/test-utils';

import { blockchainInitialState, prepareBlockchainReducer } from '../blockchainReducer';
import { blockchainActions, SetBackendPayload } from '../blockchainActions';

const blockchainReducer = prepareBlockchainReducer(extraDependenciesMock);

const urls = ['http://a, http://b, http://c'];

type BlockchainFixture = [string, BackendSettings, SetBackendPayload, BackendSettings];

const fixtures: BlockchainFixture[] = [
    ['try to set empty', {}, { coin: 'btc', type: 'electrum', urls: [] }, {}],
    [
        'set custom',
        {},
        { coin: 'btc', type: 'electrum', urls },
        { selected: 'electrum', urls: { electrum: urls } },
    ],
    [
        'change custom',
        { selected: 'electrum', urls: { electrum: urls } },
        { coin: 'btc', type: 'blockbook', urls },
        { selected: 'blockbook', urls: { electrum: urls, blockbook: urls } },
    ],
    [
        'reset with remembering',
        { selected: 'blockbook', urls: { electrum: urls, blockbook: urls } },
        { coin: 'btc', type: 'default' },
        { urls: { electrum: urls, blockbook: urls } },
    ],
    [
        'reset with forgetting',
        { selected: 'electrum', urls: { electrum: urls, blockbook: urls } },
        { coin: 'btc', type: 'electrum', urls: [] },
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
                            [payload.coin]: { ...blockchainInitialState[payload.coin], backends },
                        },
                        { type: blockchainActions.setBackend.type, payload },
                    )[payload.coin].backends,
                ).toEqual(next);
            });
        });
    });
});
