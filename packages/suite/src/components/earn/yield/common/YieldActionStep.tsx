import type { ReactNode } from 'react';

import { Translation } from '@suite/intl';
import type {
    YieldFlowDisplayToken,
    YieldPendingTransactionState,
    YieldPositionFlowType,
} from '@suite-common/wallet-core';
import { Button, Column } from '@trezor/components';

import {
    YieldAmountCard,
    type YieldAmountCardFiatToggleProps,
    type YieldAmountCardUnitToggleProps,
    type YieldApproxFiat,
} from './YieldAmountCard';
import { YieldPendingTransaction } from './YieldPendingTransaction';

const actionStepTranslationMap = {
    deposit: {
        amountLabelTranslationId: 'AMOUNT',
        submitTranslationId: 'TR_EARN_YIELD_DEPOSIT',
        balanceLabelTranslationId: 'TR_BALANCE',
    },
    withdraw: {
        amountLabelTranslationId: 'TR_EARN_YIELD_AMOUNT_TO_WITHDRAW',
        submitTranslationId: 'TR_EARN_YIELD_WITHDRAW',
        balanceLabelTranslationId: 'TR_EARN_YIELD_DEPOSITED',
    },
    redeem: {
        amountLabelTranslationId: 'TR_EARN_YIELD_AMOUNT_TO_WITHDRAW',
        submitTranslationId: 'TR_EARN_YIELD_WITHDRAW',
        balanceLabelTranslationId: 'TR_EARN_YIELD_DEPOSITED',
    },
} as const;

export type YieldActionStepProps = {
    flowType: YieldPositionFlowType;
    token: YieldFlowDisplayToken;
    summaryValue: ReactNode;
    approxFiat?: YieldApproxFiat;
    isDisabled?: boolean;
    isPending?: boolean;
    warning?: ReactNode;
    pendingTransaction?: YieldPendingTransactionState;
    unitToggle?: YieldAmountCardUnitToggleProps;
    fiatToggle?: YieldAmountCardFiatToggleProps;
    onMaxClick?: () => void;
    onSubmit: () => void;
    onPendingTxClick: (txid: string) => void;
};

export const YieldActionStep = ({
    flowType,
    token,
    summaryValue,
    approxFiat,
    isDisabled = false,
    isPending = false,
    warning,
    pendingTransaction,
    unitToggle,
    fiatToggle,
    onMaxClick,
    onSubmit,
    onPendingTxClick,
}: YieldActionStepProps) => {
    const { amountLabelTranslationId, submitTranslationId, balanceLabelTranslationId } =
        actionStepTranslationMap[flowType];

    return (
        <Column gap={16}>
            <YieldAmountCard
                tokenSymbol={token.symbol}
                decimals={token.decimals}
                approxFiat={approxFiat}
                summary={{
                    labelTranslationId: balanceLabelTranslationId,
                    value: summaryValue,
                    onMaxClick: pendingTransaction ? undefined : onMaxClick,
                }}
                heading={{
                    amountLabelTranslationId,
                }}
                unitToggle={pendingTransaction ? undefined : unitToggle}
                fiatToggle={pendingTransaction ? undefined : fiatToggle}
                warning={warning}
                isDisabled={!!pendingTransaction}
            />

            <Button
                size="large"
                width="100%"
                data-testid={`@yield/form/${flowType}-button`}
                onClick={onSubmit}
                isDisabled={isDisabled}
                isLoading={isPending}
            >
                <Translation id={submitTranslationId} />
            </Button>

            {pendingTransaction && (
                <YieldPendingTransaction
                    pendingTransaction={pendingTransaction}
                    onTxClick={onPendingTxClick}
                />
            )}
        </Column>
    );
};
