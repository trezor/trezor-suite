import { type RouteProp, useRoute } from '@react-navigation/native';

import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { type AssetsStackParamList, type AssetsStackRoutes } from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';

import { useResetToEarn } from './useResetToEarn';

export const useNavigateToEarn = () => {
    const { networkSymbol } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const resetToEarn = useResetToEarn();
    const { analytics } = useServices(injectNativeAnalytics);

    return () => {
        analytics.report({
            type: events.navigateFlowEvent.name,
            payload: {
                action: 'navigate',
                type: 'earn',
                from: 'asset-detail',
                networkSymbol,
            },
        });
        resetToEarn();
    };
};
