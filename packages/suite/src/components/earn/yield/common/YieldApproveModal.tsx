import type { CryptoId, DexApprovalType } from 'invity-api';

import type { Account } from '@suite-common/wallet-types';

import { ApproveModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/AllowanceModals/ApproveModal';
import type { AllowanceProvider } from 'src/components/suite/modals/ReduxModal/UserContextModal/AllowanceModals/types';
import { useAllowanceContext } from 'src/hooks/wallet/allowance';

type YieldApproveModalProps = {
    account: Account;
    provider: AllowanceProvider;
    amount: string;
    cryptoId: CryptoId | null;
    spender: string | null;
    onSelectApprovalType: (approvalType: DexApprovalType) => void;
    onConfirm: () => void;
};

export const YieldApproveModal = ({
    account,
    provider,
    amount,
    cryptoId,
    spender,
    onSelectApprovalType,
    onConfirm,
}: YieldApproveModalProps) => {
    const { state } = useAllowanceContext();

    if (!state.isApproveModalOpen || !cryptoId || !spender) {
        return null;
    }

    return (
        <ApproveModal
            amount={amount}
            cryptoId={cryptoId}
            account={account}
            provider={provider}
            spender={spender}
            onSelectApprovalType={onSelectApprovalType}
            onConfirm={onConfirm}
            defaultFeeLevel="high"
        />
    );
};
