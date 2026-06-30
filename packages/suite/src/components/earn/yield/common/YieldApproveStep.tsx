import type { ReactNode } from 'react';

import { Translation } from '@suite/intl';
import type {
    YieldFlowDisplayToken,
    YieldPendingTransactionState,
} from '@suite-common/wallet-core';
import { Banner, Button, Column } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

import { YieldAmountCard } from './YieldAmountCard';
import { YieldApprovedAmountCard } from './YieldApprovedAmountCard';
import { YieldPendingTransaction } from './YieldPendingTransaction';
import type { YieldApprovalAction } from '../yieldFlowUtils';

const getApproveButtonTranslationId = (approvalAction: YieldApprovalAction) => {
    switch (approvalAction) {
        case 'approve':
            return 'TR_EARN_YIELD_APPROVE_TOKEN_BUTTON';
        case 'revoke':
            return 'TR_EARN_YIELD_REVOKE_APPROVAL';
        case 'increase':
            return 'TR_EARN_YIELD_INCREASE_APPROVAL';
        case 'continue':
            return 'TR_CONTINUE';
        default:
            return exhaustive(approvalAction);
    }
};

export type YieldApproveStepProps = {
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
    pendingApproveTransaction?: YieldPendingTransactionState;
    onMaxClick?: () => void;
    onApprovalSubmit?: () => void;
    onRevoke?: () => void;
    onPendingTxClick: (txid: string) => void;
};

export const YieldApproveStep = ({
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
    pendingApproveTransaction,
    onMaxClick,
    onApprovalSubmit,
    onRevoke,
    onPendingTxClick,
}: YieldApproveStepProps) => {
    const approveButtonId = getApproveButtonTranslationId(approvalAction);
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
                        decimals={token.decimals}
                        summary={{
                            labelTranslationId: 'TR_BALANCE',
                            value: summaryValue,
                            onMaxClick: pendingApproveTransaction ? undefined : onMaxClick,
                        }}
                        heading={{
                            amountLabelTranslationId: 'AMOUNT',
                        }}
                        warning={warning}
                        isDisabled={!!pendingApproveTransaction}
                    />

                    <Button
                        size="large"
                        width="100%"
                        onClick={onApprovalSubmit}
                        isDisabled={isDisabled || !!pendingApproveTransaction || !onApprovalSubmit}
                        isLoading={isLoading}
                    >
                        <Translation id={approveButtonId} values={{ tokenSymbol: token.symbol }} />
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
