import { type ReactNode } from 'react';

import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { CurrentStepCardHeader } from '@suite-native/step-cards';

import { RevokeLimitInfoRow } from '../Approval/RevokeLimitInfoRow';

export type ExchangeFlowRevokeStepContentProps = {
    coinSymbol?: string;
    feeRow: ReactNode;
    children?: ReactNode;
};

export const ExchangeFlowRevokeStepContent = ({
    coinSymbol,
    feeRow,
    children,
}: ExchangeFlowRevokeStepContentProps) => (
    <>
        <CurrentStepCardHeader>
            <Text variant="headline-sm">
                <Translation id="moduleTrading.tradingExchangeFlowScreen.revokeStep.title" />
            </Text>
            <Text variant="body-sm" color="contentSecondary">
                <Translation
                    id="moduleTrading.tradingExchangeFlowScreen.revokeStep.description"
                    values={{ symbol: coinSymbol }}
                />
            </Text>
        </CurrentStepCardHeader>
        <RevokeLimitInfoRow />
        {feeRow}
        {children}
    </>
);
