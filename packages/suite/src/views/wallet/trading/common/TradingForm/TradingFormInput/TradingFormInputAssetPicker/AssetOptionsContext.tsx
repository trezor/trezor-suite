import { type ReactNode, createContext, useContext, useMemo } from 'react';

import { type CryptoId } from 'invity-api';

import { throwError } from '@trezor/utils';

const AssetOptionsContext = createContext<{
    includedCryptoIds: Set<CryptoId>;
}>({
    includedCryptoIds: new Set(),
});

export type AssetOptionsContextProps = {
    includedCryptoIds: Set<CryptoId>;
    children: ReactNode;
};

export function AssetOptionsProvider({ includedCryptoIds, children }: AssetOptionsContextProps) {
    const contextValue = useMemo(() => ({ includedCryptoIds }), [includedCryptoIds]);

    return (
        <AssetOptionsContext.Provider value={contextValue}>{children}</AssetOptionsContext.Provider>
    );
}

export const useAssetsContext = () =>
    useContext(AssetOptionsContext) ??
    throwError(`Can't use useAssetsContext outside of AssetOptionsProvider`);
