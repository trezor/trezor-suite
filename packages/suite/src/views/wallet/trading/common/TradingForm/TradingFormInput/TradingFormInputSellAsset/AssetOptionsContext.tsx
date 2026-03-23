import { type ReactNode, createContext, useContext, useMemo } from 'react';

import { type CryptoId } from 'invity-api';

const AssetOptionsContext = createContext<{
    includedCryptoIds: Set<CryptoId>;
    excludedCryptoIds: Set<CryptoId>;
}>({
    includedCryptoIds: new Set(),
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
    const contextValue = useMemo(
        () => ({ includedCryptoIds, excludedCryptoIds }),
        [includedCryptoIds, excludedCryptoIds],
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
