import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getTokenMetadata } from '@trezor/blockchain-link-utils/src/stellar';

import { getStellarInactiveTokens } from '../stellarTokens';

jest.mock('@trezor/blockchain-link-utils/src/stellar', () => ({
    STELLAR_DECIMALS: 7,
    getTokenMetadata: jest.fn(),
}));

const mockedGetTokenMetadata = jest.mocked(getTokenMetadata);

describe(getStellarInactiveTokens.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns empty array for non-Stellar accounts', async () => {
        const account = mockWalletAccount({ symbol: 'btc' });

        await expect(getStellarInactiveTokens(account)).resolves.toEqual([]);
        expect(mockedGetTokenMetadata).not.toHaveBeenCalled();
    });

    it('returns all tokens when account has no active Stellar tokens', async () => {
        const account = mockWalletAccount({ symbol: 'xlm', tokens: undefined });

        mockedGetTokenMetadata.mockResolvedValue({
            'USDC-GA123': { name: 'USD Coin', symbol: 'USDC', home_domain: 'centre.io', rating: 5 },
            'AQUA-GB456': { name: 'Aqua', symbol: 'AQUA', home_domain: 'aqua.network', rating: 2 },
        });

        await expect(getStellarInactiveTokens(account)).resolves.toEqual([
            {
                type: 'STELLAR-CLASSIC',
                standard: 'STELLAR-CLASSIC',
                contract: 'USDC-GA123',
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 7,
                homeDomain: 'centre.io',
                rating: 5,
            },
            {
                type: 'STELLAR-CLASSIC',
                standard: 'STELLAR-CLASSIC',
                contract: 'AQUA-GB456',
                name: 'Aqua',
                symbol: 'AQUA',
                decimals: 7,
                homeDomain: 'aqua.network',
                rating: 2,
            },
        ]);
    });

    it('filters out active Stellar tokens', async () => {
        const account = mockWalletAccount({
            symbol: 'xlm',
            tokens: [{ contract: 'YBX-GC789' }] as never,
        });

        mockedGetTokenMetadata.mockResolvedValue({
            'USDC-GA123': { name: 'USD Coin', symbol: 'USDC', home_domain: 'centre.io', rating: 5 },
            'AQUA-GB456': { name: 'Aqua', symbol: 'AQUA', home_domain: 'aqua.network', rating: 2 },
            'YBX-GC789': { name: 'YBX', symbol: 'YBX', home_domain: 'ultra.io', rating: 1 },
        });

        await expect(getStellarInactiveTokens(account)).resolves.toEqual([
            expect.objectContaining({ contract: 'USDC-GA123' }),
            expect.objectContaining({ contract: 'AQUA-GB456' }),
        ]);
    });

    it('sorts tokens by rating in descending order and keeps unrated tokens last', async () => {
        const account = mockWalletAccount({ symbol: 'xlm' });

        mockedGetTokenMetadata.mockResolvedValue({
            'LOW-GA111': { name: 'Low', symbol: 'LOW', home_domain: 'low.org', rating: 1 },
            'UNRATED-GA222': { name: 'Unrated', symbol: 'UNRATED', home_domain: 'none.org' },
            'HIGH-GA333': { name: 'High', symbol: 'HIGH', home_domain: 'high.org', rating: 9 },
        });

        const result = await getStellarInactiveTokens(account);

        expect(result.map(token => token.contract)).toEqual([
            'HIGH-GA333',
            'LOW-GA111',
            'UNRATED-GA222',
        ]);

        expect(result[2]?.rating).toBeUndefined();
    });
});
