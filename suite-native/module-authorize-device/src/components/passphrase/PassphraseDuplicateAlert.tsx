import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { switchDuplicatedDevice } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { EventType, analytics } from '@suite-native/analytics';
import { selectPassphraseDuplicateStaticSessionId } from '@suite-native/device-authorization';
import { useTranslate } from '@suite-native/intl';
import {
    AppTabsRoutes,
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { StaticSessionId } from '@trezor/connect';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList
>;

export const PassphraseDuplicateAlert = ({ children }: { children: React.ReactNode }) => {
    const dispatch = useDispatch();

    const passphraseDuplicateStaticSessionId = useSelector(
        selectPassphraseDuplicateStaticSessionId,
    );

    const { translate } = useTranslate();

    const navigation = useNavigation<NavigationProp>();

    const { showAlert } = useAlert();

    const handleDuplicateDevicePassphrase = useCallback(
        ({ duplicateStaticSessionId }: { duplicateStaticSessionId: StaticSessionId }) => {
            // Not all passphrase errors have device property, but we know this one does
            // based on condition in `./passphraseSlice`. This if is just to keep TS happy.
            if (duplicateStaticSessionId) {
                dispatch(switchDuplicatedDevice(duplicateStaticSessionId));
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
        if (passphraseDuplicateStaticSessionId) {
            analytics.report({ type: EventType.PassphraseDuplicate });
            showAlert({
                title: translate('modulePassphrase.passphraseMismatch.title'),
                description: translate('modulePassphrase.passphraseMismatch.subtitle'),
                primaryButtonTitle: translate('modulePassphrase.passphraseMismatch.button'),
                onPressPrimaryButton: () =>
                    handleDuplicateDevicePassphrase({
                        duplicateStaticSessionId: passphraseDuplicateStaticSessionId,
                    }),
            });
        }
    }, [handleDuplicateDevicePassphrase, passphraseDuplicateStaticSessionId, showAlert, translate]);

    return children ?? null;
};
