import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { walletReducers } from 'src/reducers/wallet';

import {
    selectHasConnectedNetworkBackend,
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
