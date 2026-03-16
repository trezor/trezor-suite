import { type ReactNode, createContext, useContext, useMemo } from 'react';

import { type CryptoId } from 'invity-api';

import { type TradingAssetOption, useTradingAssets } from '@suite-common/trading';

const AssetOptionsContext = createContext<{
    assets: TradingAssetOption[];
    excludedCryptoIds: Set<CryptoId>;
}>({
    assets: [],
    excludedCryptoIds: new Set(),
});

export interface AssetOptionsContextProps {
    includedCryptoIds: Set<CryptoId>;
    excludedCryptoIds: Set<CryptoId>;
    children: ReactNode;
}

export function AssetOptionsProvider({
    includedCryptoIds,
    excludedCryptoIds,
    children,
}: AssetOptionsContextProps) {
    const { buildAssetOptions } = useTradingAssets();
    const contextValue = useMemo(() => {
        const { assets } = buildAssetOptions({ includedCryptoIds });

        return { assets, excludedCryptoIds };
    }, [buildAssetOptions, excludedCryptoIds, includedCryptoIds]);

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
