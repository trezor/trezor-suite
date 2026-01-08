import { ReactNode, createContext, useContext, useMemo } from 'react';

import { CryptoId } from 'invity-api';

import { TradingAssetOption, useTradingAssets } from '@suite-common/trading';

const AssetOptionsContext = createContext<{
    assets: TradingAssetOption[];
    disabledCryptoIds: Set<CryptoId> | undefined;
}>({
    assets: [],
    disabledCryptoIds: new Set(),
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
    const { assets } = useMemo(
        () => buildAssetOptions({ enabledCryptoIds }),
        [buildAssetOptions, enabledCryptoIds],
    );

    const contextValue = useMemo(
        () => ({
            assets,
            disabledCryptoIds: disabledCryptoIds ?? new Set(),
        }),
        [assets, disabledCryptoIds],
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
