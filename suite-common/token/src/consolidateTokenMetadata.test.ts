import { asNetworkSymbol } from '@trezor/network-module-types';

import { type TokenMetadata, type TokenMetadataByNetwork } from './TokenMetadataContext';
import { consolidateTokenMetadata } from './consolidateTokenMetadata';

const eth = asNetworkSymbol('eth');
const arb = asNetworkSymbol('arb');
const token: TokenMetadata = {
    contract: 'token-a',
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
        const otherToken = Object.freeze({ ...token, contract: 'token-b' });
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

    it('returns empty metadata when both inputs are empty', () => {
        const result = consolidateTokenMetadata({ sources: [], parentTokensByNetwork: new Map() });

        expect(result.size).toBe(0);
    });
});
