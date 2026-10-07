import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type EthereumBlockbookChainNetworkDeps,
    createEthereumBlockbookChainNetwork,
} from './createEthereumBlockbookChainNetwork';
import {
    type EthereumCustomRpcChainNetworkDeps,
    createEthereumCustomRpcChainNetwork,
} from './createEthereumCustomRpcChainNetwork';

const { signal } = new AbortController();

const getAccountInfo = jest.fn();
const blockchainGetCurrentFiatRates = jest.fn();
const fetchCoinGeckoCurrentRate = jest.fn();

const blockbookDeps: EthereumBlockbookChainNetworkDeps = {
    getTrezorConnect: () => ({ getAccountInfo, blockchainGetCurrentFiatRates }),
    fetchCoinGeckoCurrentRate,
};

const customRpcDeps: EthereumCustomRpcChainNetworkDeps = {
    getTrezorConnect: () => ({ getAccountInfo }),
    fetchCoinGeckoCurrentRate,
};

const getRef = (symbol: 'eth' | 'base') =>
    ({
        symbol: asNetworkSymbol(symbol),
        descriptor: '0xabc',
        accountType: 'normal',
        connectionIdentity: 'wallet-identity',
    }) as const;

describe('Ethereum chain networks', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('reads wei through the wallet connection on Blockbook', async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: {
                balance: '2500000000000000000',
                availableBalance: '2500000000000000000',
                empty: false,
            },
        });
        const network = createEthereumBlockbookChainNetwork(blockbookDeps)({
            symbol: asNetworkSymbol('eth'),
            backend: { type: 'blockbook', urls: [] },
        });

        await expect(network.getAccountBalance({ ref: getRef('eth'), signal })).resolves.toEqual(
            expect.objectContaining({ displayBalance: '2.5' }),
        );
        expect(getAccountInfo).toHaveBeenCalledWith(
            expect.objectContaining({ coin: 'eth', identity: 'wallet-identity' }),
        );
    });

    it('builds one network per EVM chain for the same address', async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: { balance: '0', availableBalance: '0', empty: true },
        });
        const createNetwork = createEthereumBlockbookChainNetwork(blockbookDeps);
        const eth = createNetwork({
            symbol: asNetworkSymbol('eth'),
            backend: { type: 'blockbook', urls: [] },
        });
        const base = createNetwork({
            symbol: asNetworkSymbol('base'),
            backend: { type: 'blockbook', urls: [] },
        });

        await eth.getAccountBalance({ ref: getRef('eth'), signal });
        await base.getAccountBalance({ ref: getRef('base'), signal });

        expect(getAccountInfo.mock.calls.map(([params]) => params.coin)).toEqual(['eth', 'base']);
    });

    it('takes the rate from Blockbook on a Blockbook backend', async () => {
        blockchainGetCurrentFiatRates.mockResolvedValue({
            success: true,
            payload: { ts: 1, rates: { eur: 3000 } },
        });
        const network = createEthereumBlockbookChainNetwork(blockbookDeps)({
            symbol: asNetworkSymbol('eth'),
            backend: { type: 'blockbook', urls: [] },
        });

        await expect(network.getNativeFiatRate({ currency: 'eur', signal })).resolves.toEqual({
            rate: 3000,
            timestamp: 1,
        });
        expect(fetchCoinGeckoCurrentRate).not.toHaveBeenCalled();
    });

    it('takes the rate from CoinGecko on a custom RPC node', async () => {
        fetchCoinGeckoCurrentRate.mockResolvedValue({ rate: 2900, timestamp: 2 });
        const network = createEthereumCustomRpcChainNetwork(customRpcDeps)({
            symbol: asNetworkSymbol('eth'),
            backend: { type: 'evm-rpc', urls: ['https://rpc.example'] },
        });

        await expect(network.getNativeFiatRate({ currency: 'eur', signal })).resolves.toEqual({
            rate: 2900,
            timestamp: 2,
        });
        expect(network.backendType).toBe('evm-rpc');
    });
});
