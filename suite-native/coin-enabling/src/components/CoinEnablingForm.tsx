import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { changeCoinVisibility } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { events } from '@suite-native/analytics';
import {
    selectDeviceEnabledDiscoveryNetworkSymbols,
    selectDiscoveryNetworkSymbols,
} from '@suite-native/discovery';
import { Form, useForm } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';

import { DiscoveryCoinsFilter } from './DiscoveryCoinsFilter';
import {
    type CoinEnablingFormValues,
    coinEnablingFormValidationSchema,
} from '../coinEnablingSchema';

export const CoinEnablingForm = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const analytics = useAnalytics();
    const enabledNetworkSymbols = useSelector(selectDeviceEnabledDiscoveryNetworkSymbols);
    const networkSymbols = useSelector(selectDiscoveryNetworkSymbols);

    const { showAlert } = useAlert();

    const showLastNetworkAlert = useCallback(
        () =>
            showAlert({
                title: <Translation id="moduleSettings.coinEnabling.oneNetworkSymbolAlert.title" />,
                description: (
                    <Translation id="moduleSettings.coinEnabling.oneNetworkSymbolAlert.description" />
                ),
                primaryButtonTitle: <Translation id="generic.buttons.gotIt" />,
                primaryButtonVariant: 'redBold',
            }),
        [showAlert],
    );

    const form = useForm<CoinEnablingFormValues>({
        defaultValues: {
            enabledCoins: enabledNetworkSymbols,
        },
        validation: coinEnablingFormValidationSchema,
    });

    const handleSubmit = form.handleSubmit(values => {
        const changedCoins = networkSymbols.filter(
            symbol =>
                enabledNetworkSymbols.includes(symbol) !== values.enabledCoins.includes(symbol),
        );

        if (changedCoins.length === 0) return;

        changedCoins.forEach(symbol => {
            const isEnabled = values.enabledCoins.includes(symbol);
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
            <DiscoveryCoinsFilter
                networkSymbols={networkSymbols}
                onDisablingLastCoin={showLastNetworkAlert}
            />
        </Form>
    );
};
