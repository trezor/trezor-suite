import { asNetworkSymbol } from '@trezor/network-module-types';

import { ChainNetworkError } from './ChainNetworkError';
import {
    type FetchConnectTokensDeps,
    type FetchConnectTokensParams,
    createFetchConnectTokens,
} from './createFetchConnectTokens';

const DESCRIPTOR = '0xconfidential';

const mockGetAccountInfo = jest.fn();

const deps: FetchConnectTokensDeps = {
    getTrezorConnect: () => ({ getAccountInfo: mockGetAccountInfo }),
};

const fetchTokens = createFetchConnectTokens(deps);

const { signal } = new AbortController();

const erc20 = (contract: string, balance: string) => ({
    standard: 'ERC20',
    contract,
    symbol: contract.toUpperCase(),
    decimals: 6,
    balance,
});

const getParams = (
    overrides: Partial<FetchConnectTokensParams> = {},
): FetchConnectTokensParams => ({
    ref: {
        symbol: asNetworkSymbol('eth'),
        descriptor: DESCRIPTOR,
        accountType: 'normal',
        connectionIdentity: 'wallet-identity',
    },
    signal,
    fungibleStandards: ['ERC20'],
    useConnectionIdentity: true,
    details: 'tokenBalances',
    watchedTokensStrategy: { type: 'contract-filter', isContractCaseInsensitive: true },
    ...overrides,
});

describe('createFetchConnectTokens', () => {
    beforeEach(() => {
        mockGetAccountInfo.mockReset();
    });

    it('asks Connect for tokens at the network detail level', async () => {
        mockGetAccountInfo.mockResolvedValue({ success: true, payload: { tokens: [] } });

        await fetchTokens(getParams({ details: 'basic' }));

        expect(mockGetAccountInfo).toHaveBeenCalledWith({
            coin: 'eth',
            descriptor: DESCRIPTOR,
            details: 'basic',
            suppressBackupWarning: true,
            identity: 'wallet-identity',
        });
    });

    it('answers fungible tokens in whole units and leaves NFTs out', async () => {
        mockGetAccountInfo.mockResolvedValue({
            success: true,
            payload: {
                tokens: [
                    { ...erc20('0xusdc', '4440000'), name: 'USD Coin' },
                    { standard: 'ERC721', contract: '0xnft', decimals: 0, balance: '1' },
                    { standard: 'ERC20', contract: '0xempty', decimals: 18 },
                ],
            },
        });

        await expect(fetchTokens(getParams())).resolves.toEqual([
            {
                standard: 'ERC20',
                contract: '0xusdc',
                symbol: '0XUSDC',
                name: 'USD Coin',
                decimals: 6,
                balance: '4.44',
            },
            {
                standard: 'ERC20',
                contract: '0xempty',
                symbol: undefined,
                name: undefined,
                decimals: 18,
                balance: '0',
            },
        ]);
    });

    it('asks once per watched contract the answer left out', async () => {
        mockGetAccountInfo
            .mockResolvedValueOnce({ success: true, payload: { tokens: [erc20('0xAbC', '1')] } })
            .mockResolvedValueOnce({ success: true, payload: { tokens: [erc20('0xdef', '2')] } });

        const tokens = await fetchTokens(
            getParams({
                ref: { ...getParams().ref, watchedTokens: ['0xabc', '0xdef'] },
            }),
        );

        expect(mockGetAccountInfo).toHaveBeenCalledTimes(2);
        expect(mockGetAccountInfo).toHaveBeenLastCalledWith(
            expect.objectContaining({ details: 'tokenBalances', contractFilter: '0xdef' }),
        );
        expect(tokens.map(({ contract }) => contract)).toEqual(['0xAbC', '0xdef']);
    });

    it('matches watched contracts exactly where the network is case-sensitive', async () => {
        mockGetAccountInfo
            .mockResolvedValueOnce({ success: true, payload: { tokens: [erc20('Mint', '1')] } })
            .mockResolvedValueOnce({ success: false, error: { message: 'unknown' } });

        const tokens = await fetchTokens(
            getParams({
                ref: { ...getParams().ref, watchedTokens: ['mint'] },
                watchedTokensStrategy: {
                    type: 'contract-filter',
                    isContractCaseInsensitive: false,
                },
            }),
        );

        expect(mockGetAccountInfo).toHaveBeenLastCalledWith(
            expect.objectContaining({ contractFilter: 'mint' }),
        );
        // A watched token the backend cannot answer for is left out.
        expect(tokens.map(({ contract }) => contract)).toEqual(['Mint']);
    });

    it('lets the Stellar backend read watched Soroban contracts', async () => {
        mockGetAccountInfo.mockResolvedValue({ success: true, payload: { tokens: [] } });

        await fetchTokens(
            getParams({
                ref: {
                    symbol: asNetworkSymbol('xlm'),
                    descriptor: DESCRIPTOR,
                    accountType: 'normal',
                    watchedTokens: ['USDC-GISSUER', 'CCONTRACT'],
                },
                details: 'basic',
                fungibleStandards: ['STELLAR-CLASSIC', 'STELLAR-CONTRACT'],
                useConnectionIdentity: false,
                watchedTokensStrategy: { type: 'stellar-contract-tokens' },
            }),
        );

        expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
        expect(mockGetAccountInfo).toHaveBeenCalledWith(
            expect.objectContaining({ stellarContractTokens: ['CCONTRACT'] }),
        );
    });

    it('fails with a code and never with the backend message', async () => {
        mockGetAccountInfo.mockResolvedValue({
            success: false,
            error: { message: `Invalid descriptor ${DESCRIPTOR}` },
        });

        const error = await fetchTokens(getParams()).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ChainNetworkError);
        expect(String(error)).not.toContain(DESCRIPTOR);
    });
});
