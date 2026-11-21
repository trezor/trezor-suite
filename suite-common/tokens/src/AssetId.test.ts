import { asNetworkSymbol } from '@trezor/network-module-types';

import { type AssetId, getAssetKey } from './AssetId';
import { toTokenAddress } from './Token';

const eth = asNetworkSymbol('eth');
const contract = toTokenAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');

describe('asset identity', () => {
    it('accepts network and contract fields directly without an identity factory', () => {
        const assetId: AssetId = { networkSymbol: eth, contractAddress: contract };

        expect(assetId.networkSymbol).toBe(eth);
        expect(assetId.contractAddress).toBe(contract);
        expect(getAssetKey(assetId)).toBe(`eth:${contract.toLowerCase()}`);
    });

    it('matches independently created identities in maps and sets', () => {
        const first: AssetId = { networkSymbol: eth, contractAddress: contract };
        const second: AssetId = {
            networkSymbol: eth,
            contractAddress: toTokenAddress(contract.toLowerCase()),
        };
        const balances = new Map([[getAssetKey(first), '10']]);
        const history = new Set([getAssetKey(first)]);

        expect(first).not.toBe(second);
        expect(balances.get(getAssetKey(second))).toBe('10');
        expect(history.has(getAssetKey(second))).toBe(true);
        expect(first.contractAddress).toBe(contract);
    });

    it('keeps native assets separate across networks and testnets', () => {
        const keys = ['btc', 'test', 'eth', 'arb', 'base', 'sep'].map(network =>
            getAssetKey({ networkSymbol: asNetworkSymbol(network) }),
        );

        expect(keys).toEqual(['btc', 'test', 'eth', 'arb', 'base', 'sep']);
    });

    it('keeps a token separate from the native asset and from the same address on another network', () => {
        const tokenKey = getAssetKey({ networkSymbol: eth, contractAddress: contract });

        expect(tokenKey).not.toBe(getAssetKey({ networkSymbol: eth }));
        expect(tokenKey).not.toBe(
            getAssetKey({ networkSymbol: asNetworkSymbol('base'), contractAddress: contract }),
        );
    });

    it('does not collapse wrapped tokens or zero-address tokens into the native asset', () => {
        const nativeKey = getAssetKey({ networkSymbol: eth });

        for (const address of [
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            '0x0000000000000000000000000000000000000000',
        ]) {
            expect(
                getAssetKey({ networkSymbol: eth, contractAddress: toTokenAddress(address) }),
            ).not.toBe(nativeKey);
        }
    });

    it('preserves case-sensitive token identifiers', () => {
        const networkSymbol = asNetworkSymbol('sol');
        const mint = toTokenAddress('MintCaseSensitive');

        expect(getAssetKey({ networkSymbol, contractAddress: mint })).not.toBe(
            getAssetKey({ networkSymbol, contractAddress: toTokenAddress(mint.toLowerCase()) }),
        );
    });

    it('keeps full token identifiers, including separators and escaped characters', () => {
        const networkSymbol = asNetworkSymbol('ada');
        const policy = 'a'.repeat(56);
        expect(
            getAssetKey({ networkSymbol, contractAddress: toTokenAddress(`${policy}.414141`) }),
        ).not.toBe(
            getAssetKey({ networkSymbol, contractAddress: toTokenAddress(`${policy}.424242`) }),
        );
        expect(
            getAssetKey({
                networkSymbol: asNetworkSymbol('xlm'),
                contractAddress: toTokenAddress('USDC:ISSUER/asset%name'),
            }),
        ).toBe('xlm:USDC%3AISSUER%2Fasset%25name');
    });
});
