import type { ReactNode } from 'react';

import { Translation } from '@suite/intl';
import type {
    YieldActionFlowType,
    YieldFlowDisplayToken,
    YieldPendingTransactionState,
} from '@suite-common/wallet-core';
import { Button, Column } from '@trezor/components';

import { YieldAmountCard } from './YieldAmountCard';
import { YieldApprovedAmountCard } from './YieldApprovedAmountCard';
import { YieldPendingTransaction } from './YieldPendingTransaction';
import type { YieldApprovalAction } from '../yieldFlowUtils';

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
    approvalAction: YieldApprovalAction;
};

const getApproveButtonTranslationId = ({
    approvalAction,
}: GetApproveButtonTranslationIdParams): ApproveButtonTranslationId => {
    if (approvalAction === 'revoke') {
        return 'TR_EARN_YIELD_REVOKE_APPROVAL';
    }

    if (approvalAction === 'increase') {
        return 'TR_EARN_YIELD_INCREASE_APPROVAL';
    }

    return 'TR_APPROVE_DATA_TITLE';
};

export type YieldApproveStepProps = {
    flowType: YieldActionFlowType;
    token: YieldFlowDisplayToken;
    variant: 'active' | 'done';
    summaryValue: ReactNode;
    isDisabled?: boolean;
    /** Current on-chain allowance amount fetched by RPC. */
    approvedAmount?: string;
    isApprovedAmountLoading?: boolean;
    hasApprovedAmountError?: boolean;
    approvalAction: YieldApprovalAction;
    canRevokeAllowance: boolean;
    warning?: ReactNode;
    networkFeeWarning?: ReactNode;
    pendingApproveTransaction?: YieldPendingTransactionState;
    onMaxClick?: () => void;
    onApprovalSubmit?: () => void;
    onRevoke?: () => void;
    onPendingTxClick: (txid: string) => void;
};

export const YieldApproveStep = ({
    flowType,
    token,
    variant,
    summaryValue,
    isDisabled = false,
    approvedAmount,
    isApprovedAmountLoading = false,
    hasApprovedAmountError = false,
    approvalAction,
    canRevokeAllowance,
    warning,
    networkFeeWarning,
    pendingApproveTransaction,
    onMaxClick,
    onApprovalSubmit,
    onRevoke,
    onPendingTxClick,
}: YieldApproveStepProps) => {
    const { amountLabelTranslationId, balanceLabelTranslationId } =
        approveStepTranslationMap[flowType];
    const approveButtonId = getApproveButtonTranslationId({
        approvalAction,
    });
    const approvedAmountValue = approvedAmount ?? '0';
    const shouldEnableRevoke =
        canRevokeAllowance && !isApprovedAmountLoading && !hasApprovedAmountError;
    const onRevokeClick = shouldEnableRevoke ? onRevoke : undefined;

    switch (variant) {
        case 'active':
            return (
                <Column gap={16}>
                    <YieldApprovedAmountCard
                        token={token}
                        amount={approvedAmountValue}
                        isLoading={isApprovedAmountLoading}
                        hasError={hasApprovedAmountError}
                        onRevoke={onRevokeClick}
                    />

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

                    {networkFeeWarning}

                    <Button
                        size="large"
                        width="100%"
                        onClick={onApprovalSubmit}
                        isDisabled={isDisabled || !!pendingApproveTransaction || !onApprovalSubmit}
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
            );
        case 'done':
            return (
                <YieldApprovedAmountCard
                    token={token}
                    amount={approvedAmountValue}
                    isLoading={isApprovedAmountLoading}
                    hasError={hasApprovedAmountError}
                />
            );
    }
};
