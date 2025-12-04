import { ReactNode, createContext, useContext, useMemo } from 'react';

import { CryptoId } from 'invity-api';

import { TradingAssetOption, useTradingAssets } from '@suite-common/trading';
import { NetworkSymbol } from '@suite-common/wallet-config';

const AssetOptionsContext = createContext<{
    networks: NetworkSymbol[];
    assetsByTradingVolume: TradingAssetOption[];
}>({
    networks: [],
    assetsByTradingVolume: [],
});

export interface AssetOptionsContextProps {
    enabledCryptoIds: Set<CryptoId> | undefined;
    disabledCryptoIds: Set<CryptoId> | undefined;
    children: ReactNode;
}

export function AssetOptionsProvider({
    enabledCryptoIds,
    disabledCryptoIds,
    children,
}: AssetOptionsContextProps) {
    const { buildAssetOptions } = useTradingAssets();
    const { assets: assetsByTradingVolume, networks } = useMemo(
        () => buildAssetOptions({ enabledCryptoIds, disabledCryptoIds }),
        [buildAssetOptions, enabledCryptoIds, disabledCryptoIds],
    );

    const contextValue = useMemo(
        () => ({
            networks,
            assetsByTradingVolume,
        }),
        [networks, assetsByTradingVolume],
    );

    return (
        <AssetOptionsContext.Provider value={contextValue}>{children}</AssetOptionsContext.Provider>
    );
}

export function useAssetsContext() {
    const context = useContext(AssetOptionsContext);

    if (context === null) {
        throw Error(`Can't use useAssetsContext outside of AssetOptionsProvider`);
    }

    return context;
}
