import { useMemo } from 'react';

import { type TradingAssetOption, useTradingAssets } from '@suite-common/trading';

import {
    type TokenDisplayNameSource,
    getTokenCryptoIds,
    getTokensDisplaySymbolNames,
} from '../utils/tokenDisplayNames';

export const useTokenDisplaySymbolNames = (
    tokens: TokenDisplayNameSource[],
    assets?: TradingAssetOption[],
) => {
    const { buildAssetOptions } = useTradingAssets();

    const resolvedAssets = useMemo(() => {
        if (assets) {
            return assets;
        }

        const includedCryptoIds = getTokenCryptoIds(tokens);

        if (includedCryptoIds.size === 0) {
            return [];
        }

        const { assets: builtAssets } = buildAssetOptions({ includedCryptoIds });

        return builtAssets;
    }, [assets, buildAssetOptions, tokens]);

    return useMemo(
        () => getTokensDisplaySymbolNames({ assets: resolvedAssets, tokens }),
        [resolvedAssets, tokens],
    );
};
