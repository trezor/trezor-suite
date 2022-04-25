import reducer, { initialState, BackendSettings } from '@wallet-reducers/blockchainReducer';
import { BLOCKCHAIN } from '@wallet-actions/constants';
import type { BlockchainAction } from '@wallet-actions/blockchainActions';

const urls = ['http://a, http://b, http://c'];

const fixtures: [
    string,
    BackendSettings,
    Extract<BlockchainAction, { type: typeof BLOCKCHAIN.SET_BACKEND }>['payload'],
    BackendSettings,
][] = [
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
    describe('BLOCKCHAIN.SET_BACKEND', () => {
        fixtures.forEach(([description, backends, payload, next]) => {
            it(description, () => {
                expect(
                    reducer(
                        {
                            ...initialState,
                            [payload.coin]: { ...initialState[payload.coin], backends },
                        },
                        { type: BLOCKCHAIN.SET_BACKEND, payload },
                    )[payload.coin].backends,
                ).toEqual(next);
            });
        });
    });
});
