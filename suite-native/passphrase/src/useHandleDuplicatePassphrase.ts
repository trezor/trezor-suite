import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import { switchDuplicatedDevice } from '@suite-common/wallet-core';
import {
    AppTabsRoutes,
    HomeStackRoutes,
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { TrezorDevice } from '@suite-common/suite-types';
import { useTranslate } from '@suite-native/intl';

import { selectPassphraseError } from './passphraseSlice';

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList
>;

export const useHandleDuplicatePassphrase = () => {
    const dispatch = useDispatch();

    const passphraseError = useSelector(selectPassphraseError);

    const { translate } = useTranslate();

    const navigation = useNavigation<NavigationProp>();

    const { showAlert } = useAlert();

    const handleDuplicateDevicePassphrase = useCallback(
        ({ device, duplicate }: { device?: TrezorDevice; duplicate?: TrezorDevice }) => {
            // Not all passphrase errors have device property, but we know this one does
            // based on condition in `./passphraseSlice`. This if is just to keep TS happy.
            if (duplicate && device) {
                dispatch(switchDuplicatedDevice({ device, duplicate }));
                navigation.navigate(RootStackRoutes.AppTabs, {
                    screen: AppTabsRoutes.HomeStack,
                    params: {
                        screen: HomeStackRoutes.Home,
                    },
                });
            }
        },
        [dispatch, navigation],
    );

    useEffect(() => {
        if (passphraseError) {
            showAlert({
                title: translate('modulePassphrase.passphraseMismatch.title'),
                description: translate('modulePassphrase.passphraseMismatch.subtitle'),
                primaryButtonTitle: translate('modulePassphrase.passphraseMismatch.button'),
                onPressPrimaryButton: () =>
                    handleDuplicateDevicePassphrase({
                        device: passphraseError.device,
                        duplicate: passphraseError.duplicate,
                    }),
            });
        }
    }, [handleDuplicateDevicePassphrase, passphraseError, showAlert, translate]);
};
