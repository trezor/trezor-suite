import { useCallback, useState } from 'react';

import { type AllowanceTransactionType } from '@suite-common/wallet-types';

export const useTradingAllowanceState = () => {
    const [transactionType, setTransactionType] = useState<AllowanceTransactionType>('approve');
    const [isWaitingForDevice, setIsWaitingForDevice] = useState(false);

    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);

    const openApproveModal = useCallback(() => setIsApproveModalOpen(true), []);
    const closeApproveModal = useCallback(() => setIsApproveModalOpen(false), []);
    const openRevokeModal = useCallback(() => setIsRevokeModalOpen(true), []);
    const closeRevokeModal = useCallback(() => setIsRevokeModalOpen(false), []);

    return {
        transactionType,
        isWaitingForDevice,
        setTransactionType,
        setIsWaitingForDevice,
        isApproveModalOpen,
        isRevokeModalOpen,
        openApproveModal,
        closeApproveModal,
        openRevokeModal,
        closeRevokeModal,
    };
};
