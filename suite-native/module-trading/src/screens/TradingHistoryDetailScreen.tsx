import {
    DynamicScreenHeader,
    type RootStackParamList,
    type RootStackRoutes,
    Screen,
    type StackProps,
} from '@suite-native/navigation';
import {
    TradingHistoryDetail,
    TradingHistoryDetailCompactHeader,
    TradingHistoryDetailHeader,
} from '@suite-native/trading-history';

export const TradingHistoryDetailScreen = ({
    route: {
        params: { orderId },
    },
}: StackProps<RootStackParamList, RootStackRoutes.TradingHistoryDetail>) => (
    <Screen
        header={
            <DynamicScreenHeader
                compactContent={<TradingHistoryDetailCompactHeader orderId={orderId} />}
                expandedContent={<TradingHistoryDetailHeader orderId={orderId} />}
                scrollThreshold={0.65}
                closeActionType="back"
            />
        }
    >
        <TradingHistoryDetail orderId={orderId} />
    </Screen>
);
