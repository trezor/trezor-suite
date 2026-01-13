import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { switchToDuplicatedWallet } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { EventType, analytics } from '@suite-native/analytics';
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

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList
>;

export const PassphraseDuplicateAlert = ({ children }: { children: React.ReactNode }) => {
    const dispatch = useDispatch();

    const { translate } = useTranslate();

    const navigation = useNavigation<NavigationProp>();
    const { showAlert } = useAlert();

    const handleDuplicateDevicePassphrase = useCallback(() => {
        dispatch(switchToDuplicatedWallet());

        navigation.popTo(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });
    }, [dispatch, navigation]);

    useEffect(() => {
        analytics.report({ type: EventType.PassphraseDuplicate });
        showAlert({
            title: translate('modulePassphrase.passphraseMismatch.title'),
            description: translate('modulePassphrase.passphraseMismatch.subtitle'),
            primaryButtonTitle: translate('modulePassphrase.passphraseMismatch.button'),
            onPressPrimaryButton: () => handleDuplicateDevicePassphrase(),
        });
    }, [handleDuplicateDevicePassphrase, showAlert, translate]);

    return children ?? null;
};
