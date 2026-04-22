import { Translation } from '@suite/intl';
import type { YieldFlowType } from '@suite-common/suite-types';
import { Button, Column } from '@trezor/components';

import { YieldAmountCard } from './YieldAmountCard';
import { YieldApprovedAmountCard } from './YieldApprovedAmountCard';
import type { YieldFlowDisplayToken } from './types';

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

export type YieldApproveStepProps = {
    flowType: YieldFlowType;
    token: YieldFlowDisplayToken;
    variant: 'active' | 'done';
    amount: string;
    summaryValue: string;
    switchCurrencyLabel?: string;
    isSwitchDisabled?: boolean;
    approvedAmount?: string;
    onAmountSelect: (amount: string) => void;
    onMaxClick?: () => void;
    onSwitchCurrency?: () => void;
    onApprove?: () => void;
};

export const YieldApproveStep = ({
    flowType,
    token,
    variant,
    amount,
    summaryValue,
    switchCurrencyLabel,
    isSwitchDisabled = false,
    approvedAmount,
    onAmountSelect,
    onMaxClick,
    onSwitchCurrency,
    onApprove,
}: YieldApproveStepProps) => {
    const { amountLabelTranslationId, balanceLabelTranslationId } =
        approveStepTranslationMap[flowType];

    return (
        <>
            {variant === 'active' && (
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
                            switchCurrencyLabel,
                            isSwitchDisabled,
                            onSwitchCurrency,
                        }}
                        onAmountChange={onAmountSelect}
                    />

                    <Button size="large" width="100%" onClick={onApprove}>
                        <Translation id="TR_APPROVE_DATA_TITLE" />
                    </Button>
                </Column>
            )}

            {variant === 'done' && approvedAmount && (
                <YieldApprovedAmountCard token={token} amount={approvedAmount} />
            )}
        </>
    );
};
