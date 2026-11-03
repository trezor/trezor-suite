import { type PropsWithChildren, createContext, useContext } from 'react';

import { useBottomSheetModal } from '@suite-native/atoms';

import { AssetDetailAccountsBottomSheet } from './AssetDetailAccountsBottomSheet';

const AssetDetailAccountsModalContext = createContext<(() => void) | null>(null);

export const AssetDetailAccountsBottomSheetProvider = ({ children }: PropsWithChildren) => {
    const { bottomSheetRef, openModal } = useBottomSheetModal();

    return (
        <AssetDetailAccountsModalContext.Provider value={openModal}>
            {children}
            <AssetDetailAccountsBottomSheet ref={bottomSheetRef} />
        </AssetDetailAccountsModalContext.Provider>
    );
};

export const useOpenAssetDetailAccounts = () => {
    const openAccountsModal = useContext(AssetDetailAccountsModalContext);

    if (!openAccountsModal) {
        throw new Error(
            'useOpenAssetDetailAccounts must be used within AssetDetailAccountsBottomSheetProvider',
        );
    }

    return openAccountsModal;
};
