import { type ReactNode } from 'react';

import { Divider, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { CurrentStepCardHeader } from '@suite-native/step-cards';

import { OriginalLimit } from '../Approval/OriginalLimit';

export type ExchangeFlowIncreaseStepContentProps = {
    coinSymbol?: string;
    limitRow: ReactNode;
    feeRow: ReactNode;
    children?: ReactNode;
};

export const ExchangeFlowIncreaseStepContent = ({
    coinSymbol,
    limitRow,
    feeRow,
    children,
}: ExchangeFlowIncreaseStepContentProps) => (
    <>
        <CurrentStepCardHeader>
            <Text variant="headline-sm">
                <Translation id="moduleTrading.tradingExchangeFlowScreen.increaseStep.title" />
            </Text>
            <Text variant="body-sm" color="contentSecondary">
                <Translation
                    id="moduleTrading.tradingExchangeFlowScreen.increaseStep.description"
                    values={{ symbol: coinSymbol }}
                />
            </Text>
        </CurrentStepCardHeader>
        <OriginalLimit />
        {limitRow}
        <Divider testID="@exchange-flow/increase/fee-divider" />
        {feeRow}
        {children}
    </>
);
