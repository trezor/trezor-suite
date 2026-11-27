import { Translation } from '@suite-native/intl';
import { type CloseActionType, ScreenHeader } from '@suite-native/navigation';

export type ExchangeFlowScreenHeaderProps = {
    closeActionType?: CloseActionType;
};

export const ExchangeFlowScreenHeader = ({
    closeActionType = 'back',
}: ExchangeFlowScreenHeaderProps) => (
    <ScreenHeader
        closeActionType={closeActionType}
        title={<Translation id="moduleTrading.tradingExchangeFlowScreen.screenTitle" />}
    />
);
