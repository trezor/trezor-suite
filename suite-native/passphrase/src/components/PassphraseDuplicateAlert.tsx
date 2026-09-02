import { useCallback, useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { switchToDuplicatedWallet } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { useTranslate } from '@suite-native/intl';
import {
    AppTabsRoutes,
    type AuthorizeDeviceStackParamList,
    type AuthorizeDeviceStackRoutes,
    HomeStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList
>;

export const PassphraseDuplicateAlert = ({ children }: { children: React.ReactNode }) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
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
        analytics.report({ type: events.passphraseDuplicateEvent.name });
        showAlert({
            title: translate('modulePassphrase.passphraseMismatch.title'),
            description: translate('modulePassphrase.passphraseMismatch.subtitle'),
            primaryButtonTitle: translate('modulePassphrase.passphraseMismatch.button'),
            onPressPrimaryButton: () => handleDuplicateDevicePassphrase(),
        });
    }, [handleDuplicateDevicePassphrase, analytics, showAlert, translate]);

    return children ?? null;
};
