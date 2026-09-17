import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type TokenDetailByMint } from '@trezor/blockchain-link-types';
import { getTokenMetadata } from '@trezor/blockchain-link-utils/src/stellar';

import {
    getStellarActiveTokenContracts,
    getStellarInactiveTokens,
    getStellarTrustlineMemo,
    getStellarTrustlineMemoFromMetadata,
} from './stellarTokens';

jest.mock('@trezor/blockchain-link-utils/src/stellar', () => ({
    STELLAR_DECIMALS: 7,
    getTokenMetadata: jest.fn(),
}));

const mockedGetTokenMetadata = jest.mocked(getTokenMetadata);

const METADATA: TokenDetailByMint = {
    'USDC-GA123': { name: 'USD Coin', symbol: 'USDC', home_domain: 'centre.io', rating: 5 },
    'AQUA-GB456': { name: 'Aqua', symbol: 'AQUA', home_domain: 'aqua.network', rating: 2 },
    'YBX-GC789': { name: 'YBX', symbol: 'YBX', home_domain: 'ultra.io', rating: 1 },
};

const inactiveTokensOf = (tokenMetadata: TokenDetailByMint, activeContracts: string[] = []) =>
    getStellarInactiveTokens({
        contracts: Object.keys(tokenMetadata),
        activeContracts: new Set(activeContracts),
        tokenMetadata,
    });

describe(getStellarInactiveTokens.name, () => {
    it('describes every candidate from the definitions', () => {
        expect(
            inactiveTokensOf({
                'USDC-GA123': {
                    name: 'USD Coin',
                    symbol: 'USDC',
                    home_domain: 'centre.io',
                    rating: 5,
                },
            }),
        ).toEqual([
            {
                standard: 'STELLAR-CLASSIC',
                contract: 'USDC-GA123',
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 7,
                homeDomain: 'centre.io',
                rating: 5,
            },
        ]);
    });

    it('leaves out the tokens the account already holds', () => {
        expect(inactiveTokensOf(METADATA, ['YBX-GC789']).map(token => token.contract)).toEqual([
            'USDC-GA123',
            'AQUA-GB456',
        ]);
    });

    it('sorts by rating, unrated last', () => {
        const result = inactiveTokensOf({
            'LOW-GA111': { name: 'Low', symbol: 'LOW', home_domain: 'low.org', rating: 1 },
            'UNRATED-GA222': { name: 'Unrated', symbol: 'UNRATED', home_domain: 'none.org' },
            'HIGH-GA333': { name: 'High', symbol: 'HIGH', home_domain: 'high.org', rating: 9 },
        });

        expect(result.map(token => token.contract)).toEqual([
            'HIGH-GA333',
            'LOW-GA111',
            'UNRATED-GA222',
        ]);
        expect(result[2]?.rating).toBeUndefined();
    });

    it('still describes a token the definitions say nothing about', () => {
        expect(
            getStellarInactiveTokens({
                contracts: ['USDC-GA123'],
                activeContracts: new Set(),
            }),
        ).toEqual([
            expect.objectContaining({ contract: 'USDC-GA123', symbol: 'USDC', name: undefined }),
        ]);
    });
});

describe(getStellarActiveTokenContracts.name, () => {
    it('is empty for an account holding nothing', () => {
        expect(
            getStellarActiveTokenContracts(
                mockWalletAccount({ symbol: asNetworkSymbol('xlm'), tokens: undefined }),
            ),
        ).toEqual(new Set());
    });

    it('lists the contracts the account holds', () => {
        const account = mockWalletAccount({
            symbol: asNetworkSymbol('xlm'),
            tokens: [{ contract: 'YBX-GC789' }] as never,
        });

        expect(getStellarActiveTokenContracts(account)).toEqual(new Set(['YBX-GC789']));
    });
});

const USDC_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const CATCOIN_ISSUER = 'GDJVFDG5OCW5PYWHB64MGTHGFF57DRRJEDUEFDEL2SLNIOONHYJWHA3Z';
const USDC = `USDC-${USDC_ISSUER}`;
const CATCOIN = `CATCOIN12345-${CATCOIN_ISSUER}`;

describe(getStellarTrustlineMemoFromMetadata.name, () => {
    const metadataOf = (name: string) => ({ [USDC]: { name, symbol: 'USDC' } });

    it('uses the token name from the definitions', () => {
        expect(getStellarTrustlineMemoFromMetadata(USDC, metadataOf('USD Coin'))).toBe('USD Coin');
    });

    it('returns nothing for a token missing from the definitions', () => {
        expect(
            getStellarTrustlineMemoFromMetadata(CATCOIN, metadataOf('USD Coin')),
        ).toBeUndefined();
    });

    it('returns nothing for a blank name', () => {
        expect(getStellarTrustlineMemoFromMetadata(USDC, metadataOf('   '))).toBeUndefined();
    });
});

describe(getStellarTrustlineMemo.name, () => {
    it('gives up on definitions that never arrive, rather than holding up the device prompt', async () => {
        jest.useFakeTimers();
        mockedGetTokenMetadata.mockReturnValue(new Promise(() => {}));

        const memo = getStellarTrustlineMemo(USDC);
        await jest.advanceTimersByTimeAsync(10_000);

        await expect(memo).resolves.toBeUndefined();

        jest.useRealTimers();
    });
});
