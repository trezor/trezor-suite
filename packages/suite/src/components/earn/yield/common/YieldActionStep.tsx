import type { ReactNode } from 'react';

import { Translation } from '@suite/intl';
import type {
    YieldActionFlowType,
    YieldFlowDisplayToken,
    YieldPendingTransactionState,
} from '@suite-common/wallet-core';
import { Button, Column } from '@trezor/components';

import { YieldAmountCard } from './YieldAmountCard';
import { YieldPendingTransaction } from './YieldPendingTransaction';

const actionStepTranslationMap = {
    supply: {
        amountLabelTranslationId: 'TR_EARN_YIELD_AMOUNT_TO_SUPPLY',
        submitTranslationId: 'TR_EARN_YIELD_SUPPLY',
        balanceLabelTranslationId: 'TR_BALANCE',
    },
    withdraw: {
        amountLabelTranslationId: 'TR_EARN_YIELD_AMOUNT_TO_WITHDRAW',
        submitTranslationId: 'TR_EARN_YIELD_WITHDRAW',
        balanceLabelTranslationId: 'TR_EARN_YIELD_SUPPLIED',
    },
} as const;

export type YieldActionStepProps = {
    flowType: YieldActionFlowType;
    token: YieldFlowDisplayToken;
    summaryValue: ReactNode;
    isDisabled?: boolean;
    warning?: ReactNode;
    pendingTransaction?: YieldPendingTransactionState;
    onMaxClick?: () => void;
    onSubmit: () => void;
    onPendingTxClick: (txid: string) => void;
};

export const YieldActionStep = ({
    flowType,
    token,
    summaryValue,
    isDisabled = false,
    warning,
    pendingTransaction,
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
                summary={{
                    labelTranslationId: balanceLabelTranslationId,
                    value: summaryValue,
                    onMaxClick: pendingTransaction ? undefined : onMaxClick,
                }}
                heading={{
                    amountLabelTranslationId,
                }}
                warning={warning}
                isDisabled={!!pendingTransaction}
            />

            <Button
                size="large"
                width="100%"
                onClick={onSubmit}
                isDisabled={isDisabled || !!pendingTransaction}
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
