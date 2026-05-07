import type { ReactNode } from 'react';

import { Translation } from '@suite/intl';
import type {
    YieldActionFlowType,
    YieldFlowDisplayToken,
    YieldPendingTransactionState,
} from '@suite-common/wallet-core';
import { Banner, Button, Column } from '@trezor/components';

import { YieldAmountCard } from './YieldAmountCard';
import { YieldApprovedAmountCard } from './YieldApprovedAmountCard';
import { YieldPendingTransaction } from './YieldPendingTransaction';
import type { YieldApprovalAction } from '../yieldFlowUtils';

const approveStepTranslationMap = {
    deposit: {
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
    | 'TR_APPROVE_DATA_TITLE'
    | 'TR_CONTINUE';

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

    if (approvalAction === 'continue') {
        return 'TR_CONTINUE';
    }

    return 'TR_APPROVE_DATA_TITLE';
};

export type YieldApproveStepProps = {
    flowType: YieldActionFlowType;
    token: YieldFlowDisplayToken;
    variant: 'active' | 'done';
    summaryValue: ReactNode;
    isDisabled?: boolean;
    isLoading?: boolean;
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
    isLoading = false,
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
        canRevokeAllowance && !isApprovedAmountLoading && !hasApprovedAmountError && !isLoading;
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
                        isLoading={isLoading}
                    >
                        <Translation id={approveButtonId} />
                    </Button>

                    {approvalAction === 'revoke' && !isDisabled && (
                        <Banner
                            intent="warning"
                            icon="warning"
                            description={
                                <Translation id="TR_EXCHANGE_APPROVAL_FORM_REVOKE_BANNER" />
                            }
                        />
                    )}

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
