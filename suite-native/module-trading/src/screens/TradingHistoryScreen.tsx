import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { TradingHistory, TradingHistoryExportButton } from '@suite-native/trading-history';

export const TradingHistoryScreen = () => (
    <Screen
        header={
            <ScreenHeader
                title={<Translation id="moduleTrading.tradeHistory.list.title" />}
                closeActionType="back"
                rightIcon={<TradingHistoryExportButton />}
            />
        }
        isScrollable={false}
        noHorizontalPadding
    >
        <TradingHistory />
    </Screen>
);
