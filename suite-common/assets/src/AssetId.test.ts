import { toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createAssetId, parseAssetId } from './AssetId';

const eth = asNetworkSymbol('eth');
const contract = toTokenAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');

describe('asset identity', () => {
    it('encodes a token identity and decodes its normalized network and contract', () => {
        const assetId = createAssetId({ networkSymbol: eth, contractAddress: contract });

        expect(assetId).toBe(`eth:${contract.toLowerCase()}`);
        expect(parseAssetId(assetId)).toEqual({
            networkSymbol: eth,
            contractAddress: contract.toLowerCase(),
        });
    });

    it('matches identities from independent sources in maps and sets', () => {
        const first = createAssetId({ networkSymbol: eth, contractAddress: contract });
        const second = createAssetId({
            networkSymbol: eth,
            contractAddress: toTokenAddress(contract.toLowerCase()),
        });
        const balances = new Map([[first, '10']]);
        const history = new Set([first]);

        expect(first).toBe(second);
        expect(balances.get(second)).toBe('10');
        expect(history.has(second)).toBe(true);
    });

    it('keeps native assets separate across networks and testnets', () => {
        const keys = ['btc', 'test', 'eth', 'arb', 'base', 'sep'].map(network =>
            createAssetId({ networkSymbol: asNetworkSymbol(network) }),
        );

        expect(keys).toEqual(['btc', 'test', 'eth', 'arb', 'base', 'sep']);
        expect(keys.map(parseAssetId)).toEqual(
            ['btc', 'test', 'eth', 'arb', 'base', 'sep'].map(networkSymbol => ({ networkSymbol })),
        );
    });

    it('keeps a token separate from the native asset and from the same address on another network', () => {
        const tokenKey = createAssetId({ networkSymbol: eth, contractAddress: contract });

        expect(tokenKey).not.toBe(createAssetId({ networkSymbol: eth }));
        expect(tokenKey).not.toBe(
            createAssetId({ networkSymbol: asNetworkSymbol('base'), contractAddress: contract }),
        );
    });

    it('does not collapse wrapped tokens or zero-address tokens into the native asset', () => {
        const nativeKey = createAssetId({ networkSymbol: eth });

        for (const address of [
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            '0x0000000000000000000000000000000000000000',
        ]) {
            expect(
                createAssetId({ networkSymbol: eth, contractAddress: toTokenAddress(address) }),
            ).not.toBe(nativeKey);
        }
    });

    it('preserves case-sensitive token identifiers', () => {
        const networkSymbol = asNetworkSymbol('sol');
        const mint = toTokenAddress('MintCaseSensitive');

        expect(createAssetId({ networkSymbol, contractAddress: mint })).not.toBe(
            createAssetId({ networkSymbol, contractAddress: toTokenAddress(mint.toLowerCase()) }),
        );
    });

    it('keeps full token identifiers, including separators and escaped characters', () => {
        const networkSymbol = asNetworkSymbol('ada');
        const policy = 'a'.repeat(56);
        expect(
            createAssetId({ networkSymbol, contractAddress: toTokenAddress(`${policy}.414141`) }),
        ).not.toBe(
            createAssetId({ networkSymbol, contractAddress: toTokenAddress(`${policy}.424242`) }),
        );
        expect(
            createAssetId({
                networkSymbol: asNetworkSymbol('xlm'),
                contractAddress: toTokenAddress('USDC:ISSUER/asset%name'),
            }),
        ).toBe('xlm:USDC%3AISSUER%2Fasset%25name');
        const escaped = createAssetId({
            networkSymbol: asNetworkSymbol('xlm'),
            contractAddress: toTokenAddress('USDC:ISSUER/asset%name'),
        });
        expect(parseAssetId(escaped).contractAddress).toBe('USDC:ISSUER/asset%name');
    });
});
