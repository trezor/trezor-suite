import { type YieldPendingTransactionState } from '@suite-common/wallet-core';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';

import {
    EarnPendingTransactionModal,
    type EarnPendingTransactionModalRef,
} from './EarnPendingTransactionModal';
import { useYieldApprovalPendingModalData } from '../hooks/useYieldApprovalPendingModalData';

type YieldApprovalPendingModalProps = {
    ref: EarnPendingTransactionModalRef;
    account: Account;
    pendingTransaction?: YieldPendingTransactionState;
    tokenContract: TokenAddress;
    tokenSymbol: string;
    vaultName: string;
};

export const YieldApprovalPendingModal = ({
    ref,
    account,
    pendingTransaction,
    tokenContract,
    tokenSymbol,
    vaultName,
}: YieldApprovalPendingModalProps) => {
    const modalData = useYieldApprovalPendingModalData({
        account,
        pendingTransaction,
        tokenContract,
        tokenSymbol,
        vaultName,
    });

    if (!modalData) {
        return null;
    }

    return (
        <EarnPendingTransactionModal
            ref={ref}
            title={<Translation id="earn.pendingTransactionModal.confirmingApprovalTitle" />}
            resetKey={modalData.pendingTransaction.txid}
            rows={modalData.rows}
            onExploreInBlockchain={modalData.handleExploreInBlockchain}
        />
    );
};
