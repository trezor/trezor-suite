import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { networkSymbolCollection } from '@suite-common/wallet-config';
import { changeCoinVisibility } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { selectDeviceEnabledDiscoveryNetworkSymbols } from '@suite-native/discovery';
import { Form, useForm } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';

import {
    type CoinEnablingFormValues,
    getEnabledCoinsFromNetworkSymbols,
    getNetworkSymbolsFromEnabledCoins,
} from '../coinEnablingFormUtils';
import { coinEnablingFormValidationSchema } from '../coinEnablingSchema';
import { DiscoveryCoinsFilter } from './DiscoveryCoinsFilter';

export const CoinEnablingForm = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const enabledNetworkSymbols = useSelector(selectDeviceEnabledDiscoveryNetworkSymbols);

    const { showAlert } = useAlert();

    const showLastNetworkAlert = useCallback(
        () =>
            showAlert({
                title: <Translation id="moduleSettings.coinEnabling.oneNetworkSymbolAlert.title" />,
                description: (
                    <Translation id="moduleSettings.coinEnabling.oneNetworkSymbolAlert.description" />
                ),
                primaryButtonTitle: <Translation id="generic.buttons.gotIt" />,
                primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
            }),
        [showAlert],
    );

    const form = useForm<CoinEnablingFormValues>({
        defaultValues: {
            enabledCoins: getEnabledCoinsFromNetworkSymbols(enabledNetworkSymbols),
        },
        validation: coinEnablingFormValidationSchema,
    });

    const handleSubmit = form.handleSubmit((values: CoinEnablingFormValues) => {
        const enabledCoins = getNetworkSymbolsFromEnabledCoins(values.enabledCoins);
        const changedCoins = networkSymbolCollection.filter(
            symbol => enabledNetworkSymbols.includes(symbol) !== enabledCoins.includes(symbol),
        );

        if (changedCoins.length === 0) return;

        changedCoins.forEach(symbol => {
            const isEnabled = enabledCoins.includes(symbol);
            dispatch(changeCoinVisibility({ symbol, shouldBeVisible: isEnabled }));

            analytics.report({
                type: events.settingsChangeCoinEnabledEvent.name,
                payload: {
                    symbol,
                    value: isEnabled,
                },
            });
        });
    });

    useEffect(
        () =>
            navigation.addListener('beforeRemove', () => {
                handleSubmit();
            }),
        [navigation, handleSubmit],
    );

    return (
        <Form form={form}>
            <DiscoveryCoinsFilter onDisablingLastCoin={showLastNetworkAlert} />
        </Form>
    );
};
