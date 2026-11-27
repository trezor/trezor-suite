import { Translation } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';

export const ExchangePreviewScreenHeader = () => (
    <ScreenHeader
        title={<Translation id="moduleTrading.tradingExchangeFlowScreen.screenTitle" />}
        closeActionType="close"
    />
);
