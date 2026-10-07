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

const params: FetchConnectTokensParams = {
    ref: {
        symbol: asNetworkSymbol('eth'),
        descriptor: DESCRIPTOR,
        accountType: 'normal',
        connectionIdentity: 'wallet-identity',
    },
    signal,
    fungibleStandards: ['ERC20'],
    useConnectionIdentity: true,
};

describe('createFetchConnectTokens', () => {
    beforeEach(() => {
        mockGetAccountInfo.mockReset();
    });

    it('asks Connect for token balances through the wallet connection', async () => {
        mockGetAccountInfo.mockResolvedValue({ success: true, payload: { tokens: [] } });

        await fetchTokens(params);

        expect(mockGetAccountInfo).toHaveBeenCalledWith({
            coin: 'eth',
            descriptor: DESCRIPTOR,
            details: 'tokenBalances',
            suppressBackupWarning: true,
            identity: 'wallet-identity',
        });
    });

    it('answers fungible tokens in whole units and leaves NFTs out', async () => {
        mockGetAccountInfo.mockResolvedValue({
            success: true,
            payload: {
                tokens: [
                    {
                        standard: 'ERC20',
                        contract: '0xusdc',
                        symbol: 'USDC',
                        name: 'USD Coin',
                        decimals: 6,
                        balance: '4440000',
                    },
                    { standard: 'ERC721', contract: '0xnft', decimals: 0, balance: '1' },
                    { standard: 'ERC20', contract: '0xempty', decimals: 18 },
                ],
            },
        });

        await expect(fetchTokens(params)).resolves.toEqual([
            {
                standard: 'ERC20',
                contract: '0xusdc',
                symbol: 'USDC',
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

    it('answers no tokens when the backend reports none', async () => {
        mockGetAccountInfo.mockResolvedValue({ success: true, payload: {} });

        await expect(fetchTokens(params)).resolves.toEqual([]);
    });

    it('fails with a code and never with the backend message', async () => {
        mockGetAccountInfo.mockResolvedValue({
            success: false,
            error: { message: `Invalid descriptor ${DESCRIPTOR}` },
        });

        const error = await fetchTokens(params).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ChainNetworkError);
        expect(String(error)).not.toContain(DESCRIPTOR);
    });
});
