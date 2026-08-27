import { FadeIn, LinearTransition } from 'react-native-reanimated';

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

const DETAIL_LAYOUT_TRANSITION = LinearTransition.duration(250);

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
                marginTop="sp8"
                closeActionType="back"
                contentEnteringAnimation={FadeIn}
                contentLayoutAnimation={DETAIL_LAYOUT_TRANSITION}
            />
        }
    >
        <TradingHistoryDetail orderId={orderId} />
    </Screen>
);
