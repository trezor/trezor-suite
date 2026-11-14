import { FadeIn, LinearTransition } from 'react-native-reanimated';

import { VStack } from '@suite-native/atoms';
import { DynamicScreenHeader, Screen, type TradingStackRoutes } from '@suite-native/navigation';
import {
    TradingHistoryDetail,
    TradingHistoryDetailCompactHeader,
    TradingHistoryDetailHeader,
} from '@suite-native/trading-history';
import { Footer } from '@suite-native/trading-provider-utils';
import { type TradingStackScreenProps } from '@suite-native/trading-types';

import { TradingHistoryDetailWatcher } from '../components/general/TradingHistoryDetailWatcher';
import { useTradeSectionCatalogs } from '../hooks/general/useTradeSectionCatalogs';

const DETAIL_LAYOUT_TRANSITION = LinearTransition.duration(250);

export const TradingHistoryDetailScreen = ({
    route: {
        params: { orderId },
    },
}: TradingStackScreenProps<TradingStackRoutes.TradingHistoryDetail>) => {
    useTradeSectionCatalogs(orderId);

    return (
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
            <VStack spacing="sp32">
                <TradingHistoryDetail orderId={orderId} />
                <Footer />
                <TradingHistoryDetailWatcher orderId={orderId} />
            </VStack>
        </Screen>
    );
};
