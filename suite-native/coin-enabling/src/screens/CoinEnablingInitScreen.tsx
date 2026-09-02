import { useCallback } from 'react';
import { LinearTransition } from 'react-native-reanimated';

import { useNavigation } from '@react-navigation/native';

import { events as commonEvents } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { changeCoinVisibility } from '@suite-common/wallet-core';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { AnimatedBox } from '@suite-native/atoms';
import { Form, useForm } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    type AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    type StackToStackCompositeNavigationProps,
    useInterceptNativeNavigation,
} from '@suite-native/navigation';
import { useScreenHeaderSearch } from '@suite-native/search';

import {
    type CoinEnablingFormValues,
    getNetworkSymbolsFromEnabledCoins,
} from '../coinEnablingFormUtils';
import { coinEnablingFormValidationSchema } from '../coinEnablingSchema';
import { CoinEnablingInitFooter } from '../components/CoinEnablingInitFooter';
import { DiscoveryCoinsFilter } from '../components/DiscoveryCoinsFilter';
import { useHasEnabledCoin } from '../hooks/useHasEnabledCoin';

type NavigationProps = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.CoinEnablingInit,
    RootStackParamList
>;

export const CoinEnablingInitScreen = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const navigation = useNavigation<NavigationProps>();
    useInterceptNativeNavigation();

    const reportSearchAnalytics = useCallback(
        () =>
            analytics.report({
                type: commonEvents.settingsNetworkSearchUsedEvent.name,
                payload: { platform: 'mobile', origin: 'add-networks' },
            }),
        [analytics],
    );

    const { header, searchQuery } = useScreenHeaderSearch({
        title: <Translation id="networks.initialSetup.title" />,
        subtitle: <Translation id="networks.initialSetup.subtitle" />,
        closeActionType: 'close',
        onSearchUsed: reportSearchAnalytics,
    });

    const form = useForm<CoinEnablingFormValues>({
        defaultValues: {
            enabledCoins: {},
        },
        validation: coinEnablingFormValidationSchema,
    });
    const hasEnabledCoin = useHasEnabledCoin(form.control);

    const handleSubmit = form.handleSubmit((values: CoinEnablingFormValues) => {
        const enabledCoins = getNetworkSymbolsFromEnabledCoins(values.enabledCoins);

        enabledCoins.forEach(symbol => {
            dispatch(changeCoinVisibility({ symbol, shouldBeVisible: true }));
        });

        analytics.report({
            type: events.coinEnablingInitStateEvent.name,
            payload: { enabledNetworks: enabledCoins },
        });

        navigation.popTo(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ConnectingDevice,
        });
    });

    return (
        <Screen
            header={header}
            footer={hasEnabledCoin && <CoinEnablingInitFooter onSubmit={handleSubmit} />}
        >
            <AnimatedBox layout={LinearTransition} flex={1}>
                <Form form={form}>
                    <DiscoveryCoinsFilter searchQuery={searchQuery} />
                </Form>
            </AnimatedBox>
        </Screen>
    );
};
