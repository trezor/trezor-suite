import { useCallback } from 'react';

import { useFocusEffect } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { Context } from '@suite-common/message-system';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { ContextMessage } from '@suite-native/message-system';
import { Screen } from '@suite-native/navigation';
import { ScreenPerformanceRoot, useScreenPerformance } from '@suite-native/performance-metrics';

import { EarnPortfolioTrackerGuard } from '../../components/earn/EarnPortfolioTrackerGuard';
import { EarnPromoList } from '../../components/earn/EarnPromoList';
import { EarnScreenHeader } from '../../components/earn/EarnScreenHeader';

const EarnScreenContent = () => {
    const { analytics } = useServices(injectNativeAnalytics);
    const { panHandlers } = useScreenPerformance('earn');

    useFocusEffect(
        useCallback(() => {
            analytics.report({ type: events.earnNavigateEvent.name });
        }, [analytics]),
    );

    return (
        <ScreenPerformanceRoot panHandlers={panHandlers}>
            <Screen header={<DeviceManagerScreenHeader />}>
                <VStack spacing="sp24">
                    <ContextMessage context={Context.getEarnDashboard('staking')} />
                    <ContextMessage context={Context.getEarnDashboard('yield')} />

                    <EarnScreenHeader />
                    <EarnPromoList />
                </VStack>
            </Screen>
        </ScreenPerformanceRoot>
    );
};

export const EarnScreen = () => (
    <EarnPortfolioTrackerGuard>
        <EarnScreenContent />
    </EarnPortfolioTrackerGuard>
);
