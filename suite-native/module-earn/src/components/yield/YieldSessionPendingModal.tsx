import { type ReactNode } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import { type BottomSheetModalRef } from '@suite-native/atoms';

import { YieldPendingTransactionModal } from './YieldPendingTransactionModal';

type YieldSessionPendingModalProps = {
    pendingModal: {
        pendingTransaction: { amount: string };
        modalProps: {
            fee?: string;
            isExploreDisabled?: boolean;
            onDismiss?: () => void;
            onExplorePress: () => void;
            submittedAt: Date;
            txid: string;
        };
        bottomSheetRef: BottomSheetModalRef;
    } | null;
    accountLabel: string;
    accountSymbol: NetworkSymbol;
    amount?: ReactNode;
    amountLabel?: ReactNode;
    amountTokenContract?: TokenAddress;
    amountTokenSymbol?: TokenSymbol;
    shouldHandleDismiss?: boolean;
    title: ReactNode;
    vaultName?: string;
    vaultTokenContract?: TokenAddress;
};

export const YieldSessionPendingModal = ({
    pendingModal,
    amount,
    shouldHandleDismiss = false,
    ...modalDisplayProps
}: YieldSessionPendingModalProps) => {
    if (!pendingModal) {
        return null;
    }

    const { bottomSheetRef, modalProps, pendingTransaction } = pendingModal;

    return (
        <YieldPendingTransactionModal
            ref={bottomSheetRef}
            amount={amount ?? pendingTransaction.amount}
            fee={modalProps.fee}
            isExploreDisabled={modalProps.isExploreDisabled}
            onDismiss={shouldHandleDismiss ? modalProps.onDismiss : undefined}
            onExplorePress={modalProps.onExplorePress}
            submittedAt={modalProps.submittedAt}
            txid={modalProps.txid}
            {...modalDisplayProps}
        />
    );
};
