import { useCallback } from 'react';

import { useFocusEffect } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { Context } from '@suite-common/message-system';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { ContextMessage } from '@suite-native/message-system';
import { Screen } from '@suite-native/navigation';

import { EarnPortfolioTrackerGuard } from '../../components/earn/EarnPortfolioTrackerGuard';
import { EarnPromoList } from '../../components/earn/EarnPromoList';
import { EarnScreenHeader } from '../../components/earn/EarnScreenHeader';

const EarnScreenContent = () => {
    const { analytics } = useServices(injectNativeAnalytics);

    useFocusEffect(
        useCallback(() => {
            analytics.report({ type: events.earnNavigateEvent.name });
        }, [analytics]),
    );

    return (
        <Screen header={<DeviceManagerScreenHeader />}>
            <VStack spacing="sp24">
                <ContextMessage context={Context.getEarnDashboard('staking')} />
                <ContextMessage context={Context.getEarnDashboard('yield')} />

                <EarnScreenHeader />
                <EarnPromoList />
            </VStack>
        </Screen>
    );
};

export const EarnScreen = () => (
    <EarnPortfolioTrackerGuard>
        <EarnScreenContent />
    </EarnPortfolioTrackerGuard>
);
