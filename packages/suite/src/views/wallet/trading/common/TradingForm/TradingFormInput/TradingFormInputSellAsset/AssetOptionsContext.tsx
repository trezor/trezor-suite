import { type ReactNode, createContext, useContext, useMemo } from 'react';

import { type CryptoId } from 'invity-api';

import { throwError } from '@trezor/utils';

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

export const useAssetsContext = () =>
    useContext(AssetOptionsContext) ??
    throwError(`Can't use useAssetsContext outside of AssetOptionsProvider`);
