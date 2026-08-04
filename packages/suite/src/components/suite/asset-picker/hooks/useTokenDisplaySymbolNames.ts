import { useMemo } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { type TradingAssetOption, useTradingAssets } from '@suite-common/trading';
import { selectNetworkConfigDeps } from '@suite-common/wallet-config';

import {
    type TokenDisplayNameSource,
    getTokenCryptoIds,
    getTokensDisplaySymbolNames,
} from '../utils/tokenDisplayNames';

export const useTokenDisplaySymbolNames = (
    tokens: TokenDisplayNameSource[],
    assets?: TradingAssetOption[],
) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const { buildAssetOptions } = useTradingAssets();

    const resolvedAssets = useMemo(() => {
        if (assets) {
            return assets;
        }

        const includedCryptoIds = getTokenCryptoIds(networkConfigDeps, tokens);

        if (includedCryptoIds.size === 0) {
            return [];
        }

        const { assets: builtAssets } = buildAssetOptions({ includedCryptoIds });

        return builtAssets;
    }, [assets, buildAssetOptions, tokens]);

    return useMemo(
        () => getTokensDisplaySymbolNames({ ...networkConfigDeps, assets: resolvedAssets, tokens }),
        [resolvedAssets, tokens],
    );
};
