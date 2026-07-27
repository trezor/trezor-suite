import { type CryptoId } from 'invity-api';

import {
    type TradingAssetOption,
    type TradingAssetOptionWithContractAddress,
} from '@suite-common/trading';

import {
    type TokenDisplayNameSource,
    getTokenDisplaySymbolName,
    getTokensDisplaySymbolNames,
} from '../tokenDisplayNames';

const createAsset = (
    overrides: Partial<TradingAssetOptionWithContractAddress> &
        Pick<TradingAssetOptionWithContractAddress, 'id'>,
): TradingAssetOption => {
    const { id, ...assetOverrides } = overrides;

    return {
        id,
        coingeckoId: 'ethereum',
        isNativeToken: false,
        name: 'Asset Name',
        symbol: 'asset',
        displaySymbol: 'ASSET',
        contractAddress: '0x1',
        networkName: 'Ethereum',
        networkSymbol: 'eth',
        ...assetOverrides,
    };
};

describe('tokenDisplayNames', () => {
    it('returns canonical displaySymbolName for matching token crypto id', () => {
        const tokenSource: TokenDisplayNameSource = {
            account: { symbol: 'eth' },
            token: { contract: '0x1', name: 'Discovered Name' },
        };
        const tokens = [tokenSource];

        const tokenDisplaySymbolNames = getTokensDisplaySymbolNames({
            assets: [
                createAsset({
                    id: 'ethereum--0x1' as CryptoId,
                    displaySymbolName: 'Canonical Name',
                }),
            ],
            tokens,
        });

        expect(
            getTokenDisplaySymbolName({
                tokenDisplaySymbolNames,
                account: tokenSource.account,
                token: tokenSource.token,
            }),
        ).toBe('Canonical Name');
    });

    it('falls back to asset name when displaySymbolName is missing', () => {
        const tokenSource: TokenDisplayNameSource = {
            account: { symbol: 'eth' },
            token: { contract: '0x1', name: 'Discovered Name' },
        };
        const tokens = [tokenSource];

        const tokenDisplaySymbolNames = getTokensDisplaySymbolNames({
            assets: [
                createAsset({
                    id: 'ethereum--0x1' as CryptoId,
                    name: 'Asset Fallback Name',
                }),
            ],
            tokens,
        });

        expect(
            getTokenDisplaySymbolName({
                tokenDisplaySymbolNames,
                account: tokenSource.account,
                token: tokenSource.token,
            }),
        ).toBe('Asset Fallback Name');
    });

    it('falls back to discovered token name for unmatched tokens', () => {
        const tokenSource: TokenDisplayNameSource = {
            account: { symbol: 'eth' },
            token: { contract: '0x1', name: 'Discovered Name' },
        };
        const tokens = [tokenSource];

        const tokenDisplaySymbolNames = getTokensDisplaySymbolNames({
            assets: [createAsset({ id: 'ethereum--0x2' as CryptoId })],
            tokens,
        });

        expect(
            getTokenDisplaySymbolName({
                tokenDisplaySymbolNames,
                account: tokenSource.account,
                token: tokenSource.token,
            }),
        ).toBe('Discovered Name');
    });

    it('handles empty assets and tokens', () => {
        expect(getTokensDisplaySymbolNames({ assets: [], tokens: [] })).toEqual(new Map());
    });
});
