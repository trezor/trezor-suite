import { type ReactNode, createContext, useCallback, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useBottomSheetModal as useBottomSheetModalContext } from '@gorhom/bottom-sheet';

import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { useBottomSheetModal } from '@suite-native/atoms';

import { PortfolioTrackerEarnBottomSheet } from './PortfolioTrackerEarnBottomSheet';

type EarnPortfolioTrackerGuardContextValue = {
    isPortfolioTrackerDevice: boolean;
    openPortfolioTrackerSheet: () => void;
    closePortfolioTrackerSheet: () => void;
};

const EarnPortfolioTrackerGuardContext =
    createContext<EarnPortfolioTrackerGuardContextValue | null>(null);

type EarnPortfolioTrackerGuardProps = {
    children: ReactNode;
};

export const EarnPortfolioTrackerGuard = ({ children }: EarnPortfolioTrackerGuardProps) => {
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const {
        bottomSheetRef: portfolioTrackerSheetRef,
        openModal,
        closeModal: closePortfolioTrackerSheet,
    } = useBottomSheetModal();
    const { dismissAll } = useBottomSheetModalContext();

    const openPortfolioTrackerSheet = useCallback(() => {
        dismissAll();
        openModal();
    }, [dismissAll, openModal]);

    const value = useMemo(
        (): EarnPortfolioTrackerGuardContextValue => ({
            isPortfolioTrackerDevice,
            openPortfolioTrackerSheet,
            closePortfolioTrackerSheet,
        }),
        [closePortfolioTrackerSheet, isPortfolioTrackerDevice, openPortfolioTrackerSheet],
    );

    return (
        <EarnPortfolioTrackerGuardContext.Provider value={value}>
            {children}
            <PortfolioTrackerEarnBottomSheet
                bottomSheetRef={portfolioTrackerSheetRef}
                onClose={closePortfolioTrackerSheet}
            />
        </EarnPortfolioTrackerGuardContext.Provider>
    );
};

export const useEarnPortfolioTrackerGuard = (): EarnPortfolioTrackerGuardContextValue => {
    const context = useContext(EarnPortfolioTrackerGuardContext);

    if (context === null) {
        throw new Error(
            'useEarnPortfolioTrackerGuard must be used within EarnPortfolioTrackerGuard',
        );
    }

    return context;
};
