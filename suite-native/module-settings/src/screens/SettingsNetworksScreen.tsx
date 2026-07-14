import { useCallback } from 'react';
import { LinearTransition } from 'react-native-reanimated';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { AnimatedBox } from '@suite-native/atoms';
import { CoinEnablingForm } from '@suite-native/coin-enabling';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';
import { useScreenHeaderSearch } from '@suite-native/search';

export const SettingsNetworksScreen = () => {
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const reportSearchAnalytics = useCallback(
        () =>
            analytics.report({
                type: events.settingsNetworkSearchUsedEvent.name,
                payload: { platform: 'mobile', origin: 'network-settings' },
            }),
        [analytics],
    );

    const { header, searchQuery } = useScreenHeaderSearch({
        title: <Translation id="moduleSettings.networks.title" />,
        subtitle: <Translation id="moduleSettings.networks.subtitle" />,
        onSearchUsed: reportSearchAnalytics,
    });

    return (
        <Screen header={header}>
            <AnimatedBox layout={LinearTransition} flex={1}>
                <CoinEnablingForm searchQuery={searchQuery} />
            </AnimatedBox>
        </Screen>
    );
};
