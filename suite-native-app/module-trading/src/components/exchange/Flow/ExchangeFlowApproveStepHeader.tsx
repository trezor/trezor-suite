import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { CurrentStepCardHeader } from '@suite-native/step-cards';

export type ExchangeFlowApproveStepHeaderProps = {
    coinSymbol?: string;
};

export const ExchangeFlowApproveStepHeader = ({
    coinSymbol,
}: ExchangeFlowApproveStepHeaderProps) => (
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
);
