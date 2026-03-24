import { Translation } from '@suite/intl';
import { Button, Column } from '@trezor/components';

import { YieldAmountCard } from './YieldAmountCard';
import type { YieldFlowDisplayToken, YieldFlowType } from './types';

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
    flowType: YieldFlowType;
    token: YieldFlowDisplayToken;
    amount: string;
    summaryValue: string;
    isDisabled?: boolean;
    onAmountSelect: (amount: string) => void;
    onMaxClick?: () => void;
    onSubmit: () => void;
};

export const YieldActionStep = ({
    flowType,
    token,
    amount,
    summaryValue,
    isDisabled = false,
    onAmountSelect,
    onMaxClick,
    onSubmit,
}: YieldActionStepProps) => {
    const { amountLabelTranslationId, submitTranslationId, balanceLabelTranslationId } =
        actionStepTranslationMap[flowType];

    return (
        <Column gap={16}>
            <YieldAmountCard
                amount={amount}
                tokenSymbol={token.symbol}
                summary={{
                    labelTranslationId: balanceLabelTranslationId,
                    value: summaryValue,
                    onMaxClick,
                }}
                heading={{
                    amountLabelTranslationId,
                }}
                onAmountChange={onAmountSelect}
            />

            <Button size="large" width="100%" onClick={onSubmit} isDisabled={isDisabled}>
                <Translation id={submitTranslationId} />
            </Button>
        </Column>
    );
};
