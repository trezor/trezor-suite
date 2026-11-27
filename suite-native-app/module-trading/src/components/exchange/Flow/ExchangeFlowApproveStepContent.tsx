import { type ReactNode } from 'react';

import { Divider, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { CurrentStepCardHeader } from '@suite-native/step-cards';

export type ExchangeFlowApproveStepContentProps = {
    coinSymbol?: string;
    limitRow: ReactNode;
    feeRow: ReactNode;
    children?: ReactNode;
};

export const ExchangeFlowApproveStepContent = ({
    coinSymbol,
    limitRow,
    feeRow,
    children,
}: ExchangeFlowApproveStepContentProps) => (
    <>
        <CurrentStepCardHeader>
            <Text variant="headline-sm">
                <Translation id="moduleTrading.tradingExchangeFlowScreen.approveStep.title" />
            </Text>
            <Text variant="body-sm" color="contentSecondary">
                <Translation
                    id="moduleTrading.tradingExchangeFlowScreen.approveStep.description"
                    values={{ symbol: coinSymbol }}
                />
            </Text>
        </CurrentStepCardHeader>
        {limitRow}
        <Divider testID="@exchange-flow/approve/fee-divider" />
        {feeRow}
        {children}
    </>
);
