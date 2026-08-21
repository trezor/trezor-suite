import {
    DynamicScreenHeader,
    type RootStackParamList,
    type RootStackRoutes,
    Screen,
    type StackProps,
} from '@suite-native/navigation';
import {
    TradingHistoryDetail,
    TradingHistoryDetailHeader,
    TradingHistoryDetailHeaderSubtitle,
} from '@suite-native/trading-history';

export const TradingHistoryDetailScreen = ({
    route: {
        params: { orderId },
    },
}: StackProps<RootStackParamList, RootStackRoutes.TradingHistoryDetail>) => (
    <Screen
        header={
            <DynamicScreenHeader
                title={<TradingHistoryDetailHeader orderId={orderId} />}
                subtitle={<TradingHistoryDetailHeaderSubtitle orderId={orderId} />}
                closeActionType="back"
            />
        }
    >
        <TradingHistoryDetail orderId={orderId} />
    </Screen>
);
