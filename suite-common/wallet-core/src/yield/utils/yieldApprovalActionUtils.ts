import { tokenSupportsIncreasingAllowance } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

type GetYieldApprovalActionParams = {
    liveAmount: string;
    allowanceAmount?: string | null;
    isModifyMode: boolean;
    isRevokeRequired: boolean;
    tokenContractAddress?: string | null;
};

export type YieldApprovalAction = 'approve' | 'continue' | 'increase' | 'revoke';

export const getYieldApprovalAction = ({
    liveAmount,
    allowanceAmount,
    isModifyMode,
    isRevokeRequired,
    tokenContractAddress,
}: GetYieldApprovalActionParams): YieldApprovalAction => {
    if (!isModifyMode) {
        return 'approve';
    }

    const allowanceAmountValue = new BigNumber(allowanceAmount || '0');
    const liveAmountValue = new BigNumber(liveAmount || '0');
    const hasAllowanceAmount = !!allowanceAmount && !allowanceAmountValue.isZero();
    const isIncreasing = hasAllowanceAmount && liveAmountValue.gt(allowanceAmountValue);
    const needsZeroApprovalReset =
        !!tokenContractAddress && !tokenSupportsIncreasingAllowance(tokenContractAddress);

    if (isRevokeRequired || (isIncreasing && needsZeroApprovalReset)) {
        return 'revoke';
    }

    if (isIncreasing) {
        return 'increase';
    }

    if (hasAllowanceAmount) {
        return 'continue';
    }

    return 'approve';
};
