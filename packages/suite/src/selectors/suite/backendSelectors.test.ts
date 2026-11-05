import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { walletReducers } from 'src/reducers/wallet';

import {
    selectConnectingBackends,
    selectCustomBackendsStatus,
    selectHasConnectedNetworkBackend,
    selectIsCustomBackendUnreachable,
    selectUnreachableCustomBackendSymbol,
} from './backendSelectors';

type State = { wallet: ReturnType<typeof walletReducers> };
type Blockchain = State['wallet']['blockchain']['btc'];

const btc = asNetworkSymbol('btc');
const ltc = asNetworkSymbol('ltc');
const eth = asNetworkSymbol('eth');
const customUrl = 'unreachable.example:50001:t';
const customBackend: Blockchain['backends'] = {
    selected: 'electrum',
    urls: { electrum: [customUrl] },
};

// btc on a custom backend and ltc on the default one both have accounts, eth is enabled without accounts
const createState = (): State => {
    const wallet = walletReducers(undefined, { type: 'test-init' });

    return {
        wallet: {
            ...wallet,
            accounts: [mockWalletAccount({ symbol: btc }), mockWalletAccount({ symbol: ltc })],
            settings: { ...wallet.settings, enabledNetworks: [btc, ltc, eth] },
            blockchain: {
                ...wallet.blockchain,
                btc: { ...wallet.blockchain.btc, backends: customBackend },
            },
        },
    };
};

const withBlockchain = (
    state: State,
    symbol: 'btc' | 'ltc' | 'eth',
    blockchain: Partial<Blockchain>,
): State => ({
    wallet: {
        ...state.wallet,
        blockchain: {
            ...state.wallet.blockchain,
            [symbol]: { ...state.wallet.blockchain[symbol], ...blockchain },
        },
    },
});

describe('selectConnectingBackends', () => {
    it('lists networks with accounts that are neither connected nor failed, with their custom URLs', () => {
        expect(selectConnectingBackends(createState())).toEqual([
            { symbol: btc, customUrls: [customUrl], isCustom: true, status: 'connecting' },
            { symbol: ltc, customUrls: [], isCustom: false, status: 'connecting' },
        ]);
    });

    it('leaves out connected and failed networks', () => {
        const state = withBlockchain(
            withBlockchain(createState(), 'btc', { connected: true }),
            'ltc',
            { error: 'connect failed' },
        );

        expect(selectConnectingBackends(state)).toEqual([]);
    });
});

describe('selectIsCustomBackendUnreachable', () => {
    it('is true for a custom backend that failed to connect', () => {
        expect(
            selectIsCustomBackendUnreachable(
                withBlockchain(createState(), 'btc', { error: 'connect failed' }),
                btc,
            ),
        ).toBe(true);
    });

    it('is false while the custom backend is still connecting', () => {
        expect(selectIsCustomBackendUnreachable(createState(), btc)).toBe(false);
    });

    it('is false for a network on the default backend', () => {
        expect(selectIsCustomBackendUnreachable(createState(), ltc)).toBe(false);
    });

    it('is false once the custom backend is connected', () => {
        expect(
            selectIsCustomBackendUnreachable(
                withBlockchain(createState(), 'btc', { connected: true }),
                btc,
            ),
        ).toBe(false);
    });

    it('is false for a network without accounts, whose idle connection was closed', () => {
        const state = withBlockchain(createState(), 'eth', {
            backends: { selected: 'blockbook', urls: { blockbook: ['https://eth.example'] } },
            error: 'Backend disconnected',
        });

        expect(selectIsCustomBackendUnreachable(state, eth)).toBe(false);
    });

    it('is false for a network whose only account does not sync through Trezor Connect', () => {
        const state = withBlockchain(createState(), 'btc', { error: 'connect failed' });
        const coinjoinOnlyState = {
            wallet: {
                ...state.wallet,
                accounts: [
                    {
                        ...mockWalletAccount({ symbol: btc }),
                        backendType: 'coinjoin' as const,
                        status: 'ready' as const,
                    },
                ],
            },
        };

        expect(selectIsCustomBackendUnreachable(coinjoinOnlyState, btc)).toBe(false);
    });
});

describe('selectCustomBackendsStatus', () => {
    it('is connecting while the custom backend has neither connected nor failed', () => {
        expect(selectCustomBackendsStatus(createState())).toBe('connecting');
    });

    it('is connected once the custom backend connects', () => {
        expect(
            selectCustomBackendsStatus(withBlockchain(createState(), 'btc', { connected: true })),
        ).toBe('connected');
    });

    it('is failed when the custom backend failed to connect', () => {
        expect(
            selectCustomBackendsStatus(
                withBlockchain(createState(), 'btc', { error: 'connect failed' }),
            ),
        ).toBe('failed');
    });

    it('ignores default backends', () => {
        const state = withBlockchain(
            withBlockchain(createState(), 'btc', { connected: true }),
            'ltc',
            { error: 'connect failed' },
        );

        expect(selectCustomBackendsStatus(state)).toBe('connected');
    });
});

describe('selectHasConnectedNetworkBackend', () => {
    it('is false while no network with accounts is connected', () => {
        expect(
            selectHasConnectedNetworkBackend(
                withBlockchain(createState(), 'eth', { connected: true }),
            ),
        ).toBe(false);
    });

    it('is true once one network with accounts connects', () => {
        expect(
            selectHasConnectedNetworkBackend(
                withBlockchain(createState(), 'ltc', { connected: true }),
            ),
        ).toBe(true);
    });
});

describe('selectUnreachableCustomBackendSymbol', () => {
    it('returns the custom backend network that failed to connect', () => {
        expect(
            selectUnreachableCustomBackendSymbol(
                withBlockchain(createState(), 'btc', { error: 'connect failed' }),
            ),
        ).toBe(btc);
    });

    it('returns nothing while the custom backend is still connecting', () => {
        expect(selectUnreachableCustomBackendSymbol(createState())).toBeUndefined();
    });
});
