import { Translation } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';

export const ExchangeFlowScreenHeader = () => (
    <ScreenHeader
        closeActionType="back"
        title={<Translation id="moduleTrading.tradingExchangeFlowScreen.screenTitle" />}
    />
);
