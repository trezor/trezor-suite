import type { ReactNode } from 'react';

import { Translation } from '@suite/intl';
import type {
    YieldFlowDisplayToken,
    YieldPendingTransactionState,
} from '@suite-common/wallet-core';
import { Banner, Button, Column, Row } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';
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
    onSkip?: () => void;
    onRevoke?: () => void;
    onPendingTxClick: (txid: string) => void;
};

export const YieldApproveStep = ({
    token,
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
    onSkip,
    onRevoke,
    onPendingTxClick,
}: YieldApproveStepProps) => {
    const approveButtonId = getApproveButtonTranslationId(approvalAction);
    const shouldEnableRevoke =
        canRevokeAllowance && !isApprovedAmountLoading && !hasApprovedAmountError && !isLoading;
    const onRevokeClick = shouldEnableRevoke ? onRevoke : undefined;

    return (
        <Column gap={16}>
            <YieldApprovedAmountCard
                token={token}
                amount={approvedAmount}
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

            <Row gap={8} width="100%">
                <Button
                    size="large"
                    flex="1"
                    data-testid="@yield/form/approve-button"
                    onClick={onApprovalSubmit}
                    isDisabled={isDisabled || !!pendingApproveTransaction || !onApprovalSubmit}
                    isLoading={isLoading}
                >
                    <Translation id={approveButtonId} values={{ tokenSymbol: token.symbol }} />
                </Button>
                {onSkip && (
                    <Button
                        size="large"
                        intent="neutral"
                        priority="secondary"
                        data-testid="@yield/form/approve-skip-button"
                        onClick={onSkip}
                        isDisabled={isLoading || !!pendingApproveTransaction}
                    >
                        <Translation id="TR_SKIP" />
                    </Button>
                )}
            </Row>

            {approvalAction === 'revoke' && !isDisabled && (
                <Banner
                    intent="warning"
                    icon={WarningIcon}
                    description={<Translation id="TR_EXCHANGE_APPROVAL_FORM_REVOKE_BANNER" />}
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
};
