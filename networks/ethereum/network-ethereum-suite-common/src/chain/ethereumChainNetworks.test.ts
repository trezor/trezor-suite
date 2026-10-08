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
const fetchCoinGeckoHistoricRates = jest.fn();
const blockchainGetFiatRatesForTimestamps = jest.fn();

const sendConnect = {
    blockchainEstimateFee: jest.fn(),
    ethereumSignTransaction: jest.fn(),
    pushTransaction: jest.fn(),
};

const getChainPendingSends = jest.fn();

const sendAppDeps = {
    isApprovalFlowSupported: () => true,
    getChainPendingSends,
    onEvmFeeEstimationFailed: jest.fn(),
    isEvmTokenDefinitionKnown: () => Promise.resolve(false),
};

const blockbookDeps: EthereumBlockbookChainNetworkDeps = {
    getTrezorConnect: () => ({
        getAccountInfo,
        blockchainGetCurrentFiatRates,
        blockchainGetFiatRatesForTimestamps,
        ...sendConnect,
    }),
    fetchCoinGeckoCurrentRate,
    fetchCoinGeckoHistoricRates,
    ...sendAppDeps,
};

const customRpcDeps: EthereumCustomRpcChainNetworkDeps = {
    getTrezorConnect: () => ({ getAccountInfo, ...sendConnect }),
    fetchCoinGeckoCurrentRate,
    fetchCoinGeckoHistoricRates,
    ...sendAppDeps,
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
        getChainPendingSends.mockReturnValue([]);
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

    it('names its native asset as the user sees it', () => {
        const network = createEthereumBlockbookChainNetwork(blockbookDeps)({
            symbol: asNetworkSymbol('base'),
            backend: { type: 'blockbook', urls: [] },
        });

        expect(network.nativeAsset.symbol).toBe('ETH');
    });

    it('reads fungible tokens through the wallet connection', async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: {
                tokens: [
                    {
                        standard: 'ERC20',
                        contract: '0xweth',
                        symbol: 'WETH',
                        decimals: 18,
                        balance: '333300000000000000',
                    },
                    { standard: 'ERC1155', contract: '0xnft', decimals: 0, balance: '1' },
                ],
            },
        });
        const network = createEthereumBlockbookChainNetwork(blockbookDeps)({
            symbol: asNetworkSymbol('eth'),
            backend: { type: 'blockbook', urls: [] },
        });

        await expect(network.getTokens?.({ ref: getRef('eth'), signal })).resolves.toEqual([
            expect.objectContaining({ contract: '0xweth', symbol: 'WETH', balance: '0.3333' }),
        ]);
        expect(getAccountInfo).toHaveBeenCalledWith(
            expect.objectContaining({ details: 'tokenBalances', identity: 'wallet-identity' }),
        );
    });

    it('takes token rates from Blockbook on a Blockbook backend', async () => {
        blockchainGetCurrentFiatRates.mockResolvedValue({
            success: true,
            payload: { ts: 1, rates: { eur: 0.9 } },
        });
        const network = createEthereumBlockbookChainNetwork(blockbookDeps)({
            symbol: asNetworkSymbol('eth'),
            backend: { type: 'blockbook', urls: [] },
        });

        await expect(
            network.getTokenFiatRate?.({ contract: '0xusdc', currency: 'eur', signal }),
        ).resolves.toEqual({ rate: 0.9, timestamp: 1 });
        expect(blockchainGetCurrentFiatRates).toHaveBeenCalledWith({
            coin: 'eth',
            token: '0xusdc',
            currencies: ['eur'],
        });
    });

    it('takes token rates from CoinGecko on a custom RPC node', async () => {
        fetchCoinGeckoCurrentRate.mockResolvedValue({ rate: 1, timestamp: 2 });
        const network = createEthereumCustomRpcChainNetwork(customRpcDeps)({
            symbol: asNetworkSymbol('eth'),
            backend: { type: 'evm-rpc', urls: ['https://rpc.example'] },
        });

        await network.getTokenFiatRate?.({ contract: '0xusdc', currency: 'eur', signal });

        expect(fetchCoinGeckoCurrentRate).toHaveBeenCalledWith({
            symbol: 'eth',
            currency: 'eur',
            signal,
            tokenAddress: '0xusdc',
        });
    });

    it('pages its history through the wallet connection with vault data', async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: {
                history: { total: 1, transactions: [] },
                page: { index: 1, size: 25, total: 1 },
            },
        });
        const network = createEthereumBlockbookChainNetwork(blockbookDeps)({
            symbol: asNetworkSymbol('eth'),
            backend: { type: 'blockbook', urls: [] },
        });

        const page = await network.getTransactions?.({
            ref: getRef('eth'),
            cursor: { page: 1 },
            signal,
        });

        expect(page?.nextCursor).toBeNull();
        expect(getAccountInfo).toHaveBeenLastCalledWith(
            expect.objectContaining({
                details: 'txs',
                pageSize: 25,
                identity: 'wallet-identity',
                protocols: ['erc4626'],
            }),
        );
    });

    it('has no history on a custom RPC node, which keeps none', () => {
        const network = createEthereumCustomRpcChainNetwork(customRpcDeps)({
            symbol: asNetworkSymbol('eth'),
            backend: { type: 'evm-rpc', urls: ['https://rpc.example'] },
        });

        expect(network.getTransactions).toBeUndefined();
    });

    it('reads the nonce on Blockbook past the pending sends of its own backend', async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: { history: {}, misc: { nonce: '5', confirmedNonce: '5' } },
        });
        getChainPendingSends.mockReturnValue([
            { txid: '0xmine', ethereumSpecific: { status: -1, nonce: 5, gasLimit: 21000 } },
        ]);
        const network = createEthereumBlockbookChainNetwork(blockbookDeps)({
            symbol: asNetworkSymbol('eth'),
            backend: { type: 'blockbook', urls: [] },
        });

        await expect(network.getAccountNonce!({ ref: getRef('eth'), signal })).resolves.toEqual({
            confirmedNonce: 5,
            nextNonce: 6,
            pendingNonces: [5],
        });
        expect(getChainPendingSends).toHaveBeenCalledWith({
            symbol: 'eth',
            backendType: 'blockbook',
            descriptor: '0xabc',
        });
        expect(getAccountInfo).toHaveBeenCalledWith(
            expect.objectContaining({ confirmedNonce: true, identity: 'wallet-identity' }),
        );
    });

    it('reads the nonce on a custom RPC node from its mined and mempool counts', async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: { history: { unconfirmed: 1 }, misc: { nonce: '5' } },
        });
        const network = createEthereumCustomRpcChainNetwork(customRpcDeps)({
            symbol: asNetworkSymbol('eth'),
            backend: { type: 'evm-rpc', urls: ['https://rpc.example'] },
        });

        await expect(network.getAccountNonce!({ ref: getRef('eth'), signal })).resolves.toEqual({
            confirmedNonce: 5,
            nextNonce: 6,
            pendingNonces: [5],
        });
    });

    it('signs at the nonce the network resolves', async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: { history: {}, misc: { nonce: '9', confirmedNonce: '8' } },
        });
        sendConnect.ethereumSignTransaction.mockResolvedValue({
            success: true,
            payload: { serializedTx: '0xsigned' },
        });
        const network = createEthereumBlockbookChainNetwork(blockbookDeps)({
            symbol: asNetworkSymbol('eth'),
            backend: { type: 'blockbook', urls: [] },
        });

        const signed = await network.send!.sign({
            account: {
                symbol: asNetworkSymbol('eth'),
                descriptor: '0xabc',
                index: 0,
                path: "m/44'/60'/0'/0/0",
                accountType: 'normal',
                deviceState: 'wallet-identity',
                balance: '1000000000000000000',
                availableBalance: '1000000000000000000',
                formattedBalance: '1',
            },
            draft: {
                outputs: [
                    {
                        type: 'payment',
                        address: '0x0000000000000000000000000000000000000001',
                        amount: '0.1',
                        fiat: '',
                        currency: { value: 'usd', label: 'USD' },
                        token: null,
                    },
                ],
                feePerUnit: '1',
                feeLimit: '21000',
                options: [],
                isCoinControlEnabled: false,
                selectedUtxos: [],
            },
            precomposed: {
                type: 'final',
                fee: '21000000000000',
                feePerByte: '1',
                feeLimit: '21000',
                totalSpent: '100021000000000000',
                bytes: 0,
                inputs: [],
                outputs: [],
                outputsPermutation: [],
            } as never,
            options: { device: { path: 'device' } as never },
        });

        expect(signed).toEqual({ serializedTx: '0xsigned', nonce: '9' });
        expect(sendConnect.ethereumSignTransaction).toHaveBeenCalledWith(
            expect.objectContaining({ transaction: expect.objectContaining({ nonce: '0x9' }) }),
        );
    });
});
