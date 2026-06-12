import type { ReactNode } from 'react';

import { Translation } from '@suite/intl';
import type {
    YieldActionFlowType,
    YieldFlowDisplayToken,
    YieldPendingTransactionState,
} from '@suite-common/wallet-core';
import { Button, Column } from '@trezor/components';

import { YieldAmountCard, type YieldAmountCardUnitToggleProps } from './YieldAmountCard';
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
} as const;

export type YieldActionStepProps = {
    flowType: YieldActionFlowType;
    token: YieldFlowDisplayToken;
    summaryValue: ReactNode;
    isDisabled?: boolean;
    isPending?: boolean;
    warning?: ReactNode;
    pendingTransaction?: YieldPendingTransactionState;
    unitToggle?: YieldAmountCardUnitToggleProps;
    onMaxClick?: () => void;
    onSubmit: () => void;
    onPendingTxClick: (txid: string) => void;
};

export const YieldActionStep = ({
    flowType,
    token,
    summaryValue,
    isDisabled = false,
    isPending = false,
    warning,
    pendingTransaction,
    unitToggle,
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
                summary={{
                    labelTranslationId: balanceLabelTranslationId,
                    value: summaryValue,
                    onMaxClick: pendingTransaction ? undefined : onMaxClick,
                }}
                heading={{
                    amountLabelTranslationId,
                }}
                unitToggle={pendingTransaction ? undefined : unitToggle}
                warning={warning}
                isDisabled={!!pendingTransaction}
            />

            <Button
                size="large"
                width="100%"
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
