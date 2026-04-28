import type { ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { tokenSupportsIncreasingAllowance } from '@suite-common/trading';
import type {
    YieldFlowDisplayToken,
    YieldFlowType,
    YieldPendingTransactionState,
} from '@suite-common/wallet-core';
import { Button, Column } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { YieldAmountCard } from './YieldAmountCard';
import { YieldApprovedAmountCard } from './YieldApprovedAmountCard';
import { YieldPendingTransaction } from './YieldPendingTransaction';

const approveStepTranslationMap = {
    supply: {
        amountLabelTranslationId: 'TR_EARN_YIELD_AMOUNT_TO_SUPPLY',
        balanceLabelTranslationId: 'TR_BALANCE',
    },
    withdraw: {
        amountLabelTranslationId: 'TR_EARN_YIELD_AMOUNT_TO_WITHDRAW',
        balanceLabelTranslationId: 'TR_EARN_YIELD_SUPPLIED',
    },
} as const;

type ApproveButtonTranslationId =
    | 'TR_EARN_YIELD_REVOKE_APPROVAL'
    | 'TR_EARN_YIELD_INCREASE_APPROVAL'
    | 'TR_APPROVE_DATA_TITLE';

type GetApproveButtonTranslationIdParams = {
    shouldRevokeApproval: boolean;
    isModifyMode: boolean;
    isIncreasing: boolean;
};

type GetApprovalStateParams = {
    amount: string;
    previousApprovedAmount?: string;
    isModifyMode: boolean;
    isRevokeRequired: boolean;
    tokenContractAddress?: string | null;
};

const getApprovalState = ({
    amount,
    previousApprovedAmount,
    isModifyMode,
    isRevokeRequired,
    tokenContractAddress,
}: GetApprovalStateParams) => {
    if (!isModifyMode) {
        return {
            isIncreasing: false,
            shouldRevokeApproval: false,
        };
    }

    const previousApprovedAmountValue = new BigNumber(previousApprovedAmount || '0');
    const amountValue = new BigNumber(amount || '0');
    const hasPreviousApprovedAmount =
        !!previousApprovedAmount && !previousApprovedAmountValue.isZero();
    const isAmountChanged =
        hasPreviousApprovedAmount && !amountValue.eq(previousApprovedAmountValue);
    const isIncreasing = hasPreviousApprovedAmount && amountValue.gt(previousApprovedAmountValue);
    const needsZeroApprovalReset =
        !!tokenContractAddress && !tokenSupportsIncreasingAllowance(tokenContractAddress);

    return {
        isIncreasing,
        shouldRevokeApproval: isRevokeRequired || (isAmountChanged && needsZeroApprovalReset),
    };
};

const getApproveButtonTranslationId = ({
    shouldRevokeApproval,
    isModifyMode,
    isIncreasing,
}: GetApproveButtonTranslationIdParams): ApproveButtonTranslationId => {
    if (shouldRevokeApproval) {
        return 'TR_EARN_YIELD_REVOKE_APPROVAL';
    }

    if (isModifyMode && isIncreasing) {
        return 'TR_EARN_YIELD_INCREASE_APPROVAL';
    }

    return 'TR_APPROVE_DATA_TITLE';
};

export type YieldApproveStepProps = {
    flowType: YieldFlowType;
    token: YieldFlowDisplayToken;
    variant: 'active' | 'done';
    /** Live input value — used for change/increase calculations. */
    amount: string;
    summaryValue: ReactNode;
    isDisabled?: boolean;
    /** Committed approval amount — shown in the done variant. */
    approvedAmount?: string;
    isModifyMode?: boolean;
    previousApprovedAmount?: string;
    isRevokeRequired?: boolean;
    warning?: ReactNode;
    pendingApproveTransaction?: YieldPendingTransactionState;
    onMaxClick?: () => void;
    onApprove?: () => void;
    onRevoke?: () => void;
    onPendingTxClick: (txid: string) => void;
};

export const YieldApproveStep = ({
    flowType,
    token,
    variant,
    amount,
    summaryValue,
    isDisabled = false,
    approvedAmount,
    isModifyMode = false,
    previousApprovedAmount,
    isRevokeRequired = false,
    warning,
    pendingApproveTransaction,
    onMaxClick,
    onApprove,
    onRevoke,
    onPendingTxClick,
}: YieldApproveStepProps) => {
    const { amountLabelTranslationId, balanceLabelTranslationId } =
        approveStepTranslationMap[flowType];
    const { isIncreasing, shouldRevokeApproval } = getApprovalState({
        amount,
        previousApprovedAmount,
        isModifyMode,
        isRevokeRequired,
        tokenContractAddress: token.contractAddress,
    });
    const approveButtonId = getApproveButtonTranslationId({
        shouldRevokeApproval,
        isModifyMode,
        isIncreasing,
    });
    const onApproveButtonClick = shouldRevokeApproval ? onRevoke : onApprove;

    return (
        <>
            {variant === 'active' && (
                <Column gap={16}>
                    {previousApprovedAmount && (
                        <YieldApprovedAmountCard
                            token={token}
                            amount={previousApprovedAmount}
                            onRevoke={onRevoke}
                        />
                    )}

                    <YieldAmountCard
                        tokenSymbol={token.symbol}
                        summary={{
                            labelTranslationId: balanceLabelTranslationId,
                            value: summaryValue,
                            onMaxClick: pendingApproveTransaction ? undefined : onMaxClick,
                        }}
                        heading={{
                            amountLabelTranslationId,
                        }}
                        warning={warning}
                        isDisabled={!!pendingApproveTransaction}
                    />

                    <Button
                        size="large"
                        width="100%"
                        onClick={onApproveButtonClick}
                        isDisabled={
                            isDisabled || !!pendingApproveTransaction || !onApproveButtonClick
                        }
                    >
                        <Translation id={approveButtonId} />
                    </Button>

                    {pendingApproveTransaction && (
                        <YieldPendingTransaction
                            pendingTransaction={pendingApproveTransaction}
                            onTxClick={onPendingTxClick}
                        />
                    )}
                </Column>
            )}

            {variant === 'done' && approvedAmount && (
                <YieldApprovedAmountCard token={token} amount={approvedAmount} />
            )}
        </>
    );
};
