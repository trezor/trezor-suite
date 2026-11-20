import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { CurrentStepCardHeader } from '@suite-native/step-cards';

export type ExchangeFlowIncreaseStepHeaderProps = {
    coinSymbol?: string;
};

export const ExchangeFlowIncreaseStepHeader = ({
    coinSymbol,
}: ExchangeFlowIncreaseStepHeaderProps) => (
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
);
