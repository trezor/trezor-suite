import { useCallback, useState } from 'react';

import { type AllowanceType } from '@suite-common/wallet-types';

export const useAllowanceState = () => {
    const [approvalType, setApprovalType] = useState<AllowanceType>('APPROVE');
    const [isWaitingForDevice, setIsWaitingForDevice] = useState(false);

    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);

    const openApproveModal = useCallback(() => setIsApproveModalOpen(true), []);
    const closeApproveModal = useCallback(() => setIsApproveModalOpen(false), []);
    const openRevokeModal = useCallback(() => setIsRevokeModalOpen(true), []);
    const closeRevokeModal = useCallback(() => setIsRevokeModalOpen(false), []);

    return {
        approvalType,
        isWaitingForDevice,
        setApprovalType,
        setIsWaitingForDevice,
        isApproveModalOpen,
        isRevokeModalOpen,
        openApproveModal,
        closeApproveModal,
        openRevokeModal,
        closeRevokeModal,
    };
};
