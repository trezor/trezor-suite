import { ChainNetworkError } from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type BitcoinBlockbookChainNetworkDeps,
    createBitcoinBlockbookChainNetwork,
} from './createBitcoinBlockbookChainNetwork';
import {
    type BitcoinElectrumChainNetworkDeps,
    createBitcoinElectrumChainNetwork,
} from './createBitcoinElectrumChainNetwork';

const { signal } = new AbortController();
const ref = { symbol: asNetworkSymbol('btc'), descriptor: 'zpub', accountType: 'normal' } as const;

const getAccountInfo = jest.fn();
const blockchainGetCurrentFiatRates = jest.fn();
const fetchCoinGeckoCurrentRate = jest.fn();
const fetchBlockbookHttpCurrentRate = jest.fn();

const blockbookDeps: BitcoinBlockbookChainNetworkDeps = {
    getTrezorConnect: () => ({ getAccountInfo, blockchainGetCurrentFiatRates }),
    fetchCoinGeckoCurrentRate,
};

const electrumDeps: BitcoinElectrumChainNetworkDeps = {
    getTrezorConnect: () => ({ getAccountInfo }),
    fetchBlockbookHttpCurrentRate,
    fetchCoinGeckoCurrentRate,
};

const blockbook = { type: 'blockbook', urls: [] } as const;
const electrum = { type: 'electrum', urls: ['electrum.example:50001:s'] } as const;

describe('Bitcoin chain networks', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('reads satoshis with the gap limit and no connection identity', async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: { balance: '150000000', availableBalance: '100000000', empty: false },
        });
        const network = createBitcoinBlockbookChainNetwork(blockbookDeps)({
            symbol: asNetworkSymbol('btc'),
            backend: blockbook,
            gapLimit: 40,
        });

        await expect(network.getAccountBalance({ ref, signal })).resolves.toEqual({
            balance: '1.5',
            availableBalance: '1',
            displayBalance: '1',
            empty: false,
        });
        expect(getAccountInfo).toHaveBeenCalledWith(
            expect.objectContaining({ coin: 'btc', gap: 40, identity: undefined }),
        );
    });

    it('takes the rate from Blockbook on a Blockbook backend', async () => {
        blockchainGetCurrentFiatRates.mockResolvedValue({
            success: true,
            payload: { ts: 1, rates: { usd: 60000 } },
        });
        const network = createBitcoinBlockbookChainNetwork(blockbookDeps)({
            symbol: asNetworkSymbol('btc'),
            backend: blockbook,
        });

        await expect(network.getNativeFiatRate({ currency: 'usd', signal })).resolves.toEqual({
            rate: 60000,
            timestamp: 1,
        });
    });

    it('takes the rate from public Blockbook, then CoinGecko, on Electrum', async () => {
        const network = createBitcoinElectrumChainNetwork(electrumDeps)({
            symbol: asNetworkSymbol('btc'),
            backend: electrum,
        });

        fetchBlockbookHttpCurrentRate.mockResolvedValueOnce({ rate: 1, timestamp: 1 });
        await expect(network.getNativeFiatRate({ currency: 'usd', signal })).resolves.toEqual({
            rate: 1,
            timestamp: 1,
        });
        expect(fetchCoinGeckoCurrentRate).not.toHaveBeenCalled();

        fetchBlockbookHttpCurrentRate.mockResolvedValueOnce(null);
        fetchCoinGeckoCurrentRate.mockResolvedValueOnce({ rate: 2, timestamp: 2 });
        await expect(network.getNativeFiatRate({ currency: 'usd', signal })).resolves.toEqual({
            rate: 2,
            timestamp: 2,
        });
        expect(network.backendType).toBe('electrum');
    });

    it('has no fiat rate on testnets', async () => {
        const network = createBitcoinBlockbookChainNetwork(blockbookDeps)({
            symbol: asNetworkSymbol('test'),
            backend: blockbook,
        });

        await expect(network.getNativeFiatRate({ currency: 'usd', signal })).resolves.toBeNull();
        expect(blockchainGetCurrentFiatRates).not.toHaveBeenCalled();
    });

    it('refuses a symbol that is not Bitcoin-like', () => {
        expect(() =>
            createBitcoinBlockbookChainNetwork(blockbookDeps)({
                symbol: asNetworkSymbol('eth'),
                backend: blockbook,
            }),
        ).toThrow(new ChainNetworkError('unsupported-network', asNetworkSymbol('eth')));
    });
});
