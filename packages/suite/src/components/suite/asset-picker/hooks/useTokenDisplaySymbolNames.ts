import { useMemo } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkModuleRepositoryDep } from '@suite-common/networks';
import {
    type TradingAssetOption,
    buildAssetOptions,
    selectTradingInfo,
} from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';

import {
    type TokenDisplayNameSource,
    getTokenCryptoIds,
    getTokensDisplaySymbolNames,
} from '../utils/tokenDisplayNames';

export const useTokenDisplaySymbolNames = (
    tokens: TokenDisplayNameSource[],
    assets?: TradingAssetOption[],
) => {
    const { coins, platforms } = useSelector(selectTradingInfo);
    const { networkModuleRepository } = useServices(selectNetworkModuleRepositoryDep);

    const resolvedAssets = useMemo(() => {
        if (assets) {
            return assets;
        }

        const includedCryptoIds = getTokenCryptoIds(tokens);

        if (includedCryptoIds.size === 0) {
            return [];
        }

        const { assets: builtAssets } = buildAssetOptions({
            coins,
            platforms,
            includedCryptoIds,
            supportedAddressValidatorSymbols: networkModuleRepository.getSupportedNetworks(),
        });

        return builtAssets;
    }, [assets, coins, networkModuleRepository, platforms, tokens]);

    return useMemo(
        () => getTokensDisplaySymbolNames({ assets: resolvedAssets, tokens }),
        [resolvedAssets, tokens],
    );
};
