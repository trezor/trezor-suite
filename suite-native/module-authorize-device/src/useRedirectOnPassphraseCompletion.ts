import { useEffect } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';

import { useNavigation, useRoute } from '@react-navigation/native';

import {
    DiscoveryRootState,
    cancelDiscoveryThunk,
    selectDiscoveryByDevicePath,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { EventType, analytics } from '@suite-native/analytics';
import {
    selectDiscoveryCompleted,
    selectHasVerificationCancelledError,
    selectPassphraseError,
} from '@suite-native/device-authorization';
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
    AuthorizeDeviceStackRoutes.PassphraseConfirmOnTrezor,
    RootStackParamList
>;
export const useRedirectOnPassphraseCompletion = () => {
    const device = useSelector(selectSelectedDevice);

    const passphraseDiscoveryCompleted = useSelector(selectDiscoveryCompleted);
    const hasPassphraseError = useSelector(selectPassphraseError);
    const hasVerificationCancelledError = useSelector(selectHasVerificationCancelledError);

    const dispatch = useDispatch();
    const store = useStore();
    const navigation = useNavigation<NavigationProp>();

    const route = useRoute();

    useEffect(() => {
        // If there is passphrase error, we don't want to go back, but handle errors through alerts within the flow
        if (passphraseDiscoveryCompleted && !hasPassphraseError) {
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });

            const discovery = selectDiscoveryByDevicePath(
                store.getState() as DiscoveryRootState,
                device?.path,
            );
            analytics.report({
                type: EventType.PassphraseFlowFinished,
                payload: { isEmptyWallet: Boolean(discovery?.emptyWallet) },
            });
        }
    }, [passphraseDiscoveryCompleted, hasPassphraseError, navigation, store, device?.path]);

    useEffect(() => {
        // User has canceled the authorization process on device (authorizeDeviceThunk rejects with auth-failed error)
        if (hasVerificationCancelledError && device) {
            analytics.report({
                type: EventType.PassphraseExit,
                payload: { screen: route.name },
            });
            dispatch(cancelDiscoveryThunk(device));
        }
    }, [dispatch, hasVerificationCancelledError, route.name, device]);
};
