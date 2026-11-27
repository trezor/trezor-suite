import { toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { type TokenMetadata, type TokenMetadataByNetwork } from './TokenMetadataContext';
import { consolidateTokenMetadata } from './consolidateTokenMetadata';

const eth = asNetworkSymbol('eth');
const arb = asNetworkSymbol('arb');
const sol = asNetworkSymbol('sol');
const token: TokenMetadata = {
    contract: toTokenAddress('token-a'),
    name: 'Token A',
    symbol: 'AAA',
    decimals: 18,
    standard: 'ERC20',
};
const preferred: TokenMetadata = { contract: token.contract, symbol: 'FIRST', decimals: 0 };

describe('consolidateTokenMetadata', () => {
    it.each([
        {
            location: 'sources',
            sources: [
                { networkSymbol: eth, tokens: [preferred] },
                { networkSymbol: eth, tokens: [token] },
            ],
        },
        {
            location: 'records within a source',
            sources: [{ networkSymbol: eth, tokens: [preferred, token] }],
        },
    ])('prefers earlier $location and fills missing fields', ({ sources }) => {
        const result = consolidateTokenMetadata({ sources, parentTokensByNetwork: new Map() });

        expect(result.get(eth)?.get(token.contract)).toStrictEqual({
            ...token,
            symbol: 'FIRST',
            decimals: 0,
        });
    });

    it('inherits parent fields and other tokens without mutating any input', () => {
        const parentToken = Object.freeze({ ...token });
        const otherToken = Object.freeze({ ...token, contract: toTokenAddress('token-b') });
        const parentTokens = new Map([
            [parentToken.contract, parentToken],
            [otherToken.contract, otherToken],
        ]);
        const parentTokensByNetwork: TokenMetadataByNetwork = new Map([[eth, parentTokens]]);
        const source = Object.freeze({
            networkSymbol: eth,
            tokens: Object.freeze([
                Object.freeze({ contract: token.contract, name: 'Local name' }),
            ]),
        });
        const sources = Object.freeze([source]);

        const result = consolidateTokenMetadata({ sources, parentTokensByNetwork });

        expect(result.get(eth)?.get(token.contract)).toStrictEqual({
            ...token,
            name: 'Local name',
        });
        expect(result.get(eth)?.get(otherToken.contract)).toStrictEqual(otherToken);
        expect(parentTokens.get(token.contract)).toStrictEqual(token);
        expect(parentTokens.get(otherToken.contract)).toStrictEqual(otherToken);
        expect(parentTokens.size).toBe(2);
    });

    it('keeps the same contract separate across networks', () => {
        const result = consolidateTokenMetadata({
            sources: [
                { networkSymbol: eth, tokens: [token] },
                { networkSymbol: arb, tokens: [{ ...token, symbol: 'ARB' }] },
            ],
            parentTokensByNetwork: new Map(),
        });

        expect(result.get(eth)?.get(token.contract)?.symbol).toBe('AAA');
        expect(result.get(arb)?.get(token.contract)?.symbol).toBe('ARB');
    });

    it('retains parent networks that have no local sources', () => {
        const parentTokensByNetwork: TokenMetadataByNetwork = new Map([
            [arb, new Map([[token.contract, token]])],
        ]);

        const result = consolidateTokenMetadata({
            sources: [{ networkSymbol: eth, tokens: [preferred] }],
            parentTokensByNetwork,
        });

        expect(result.get(arb)?.get(token.contract)).toStrictEqual(token);
        expect(parentTokensByNetwork.has(eth)).toBe(false);
    });

    it('merges EVM contract casings into one entry', () => {
        const checksummed = toTokenAddress('0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168');
        const lowercased = toTokenAddress(checksummed.toLowerCase());

        const result = consolidateTokenMetadata({
            sources: [{ networkSymbol: eth, tokens: [{ contract: checksummed, symbol: 'USDG' }] }],
            parentTokensByNetwork: new Map([
                [eth, new Map([[lowercased, { contract: lowercased, decimals: 18 }]])],
            ]),
        });

        expect(result.get(eth)?.size).toBe(1);
        expect(result.get(eth)?.get(lowercased)).toStrictEqual({
            contract: checksummed,
            name: undefined,
            symbol: 'USDG',
            decimals: 18,
            standard: undefined,
        });
    });

    it('keeps differently cased mints apart outside EVM networks', () => {
        const mint = toTokenAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
        const otherMint = toTokenAddress(mint.toLowerCase());

        const result = consolidateTokenMetadata({
            sources: [
                {
                    networkSymbol: sol,
                    tokens: [
                        { contract: mint, symbol: 'USDC' },
                        { contract: otherMint, symbol: 'OTHER' },
                    ],
                },
            ],
            parentTokensByNetwork: new Map(),
        });

        expect(result.get(sol)?.get(mint)?.symbol).toBe('USDC');
        expect(result.get(sol)?.get(otherMint)?.symbol).toBe('OTHER');
    });

    it('returns empty metadata when both inputs are empty', () => {
        const result = consolidateTokenMetadata({ sources: [], parentTokensByNetwork: new Map() });

        expect(result.size).toBe(0);
    });
});
