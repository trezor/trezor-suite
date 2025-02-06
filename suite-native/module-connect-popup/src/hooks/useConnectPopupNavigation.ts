import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import { connectPopupDeeplinkThunk, selectConnectPopupCall } from '@suite-common/connect-popup';
import { isDevelopOrDebugEnv } from '@suite-native/config';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import {
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.ConnectPopup,
    RootStackParamList
>;

const isConnectPopupUrl = (url: string): boolean => {
    if (isDevelopOrDebugEnv()) {
        if (url.startsWith('trezorsuitelite://connect')) return true;
        if (/^https:\/\/dev\.suite\.sldev\.cz\/connect\/(.*)\/deeplink(.*)$/g.test(url))
            return true;
    }
    if (/^https:\/\/connect\.trezor\.io\/9\/deeplink(.*)$/g.test(url)) return true;

    return false;
};

// TODO: will be necessary to handle if device is not connected/unlocked so we probably want to wait until user unlock device
// we already have some modals like biometrics or coin enabled which are waiting for device to be connected
export const useConnectPopupNavigation = () => {
    const featureFlagEnabled = useFeatureFlag(FeatureFlag.IsConnectPopupEnabled);
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch();
    const connectPopupCall = useSelector(selectConnectPopupCall);

    // Handle deeplink
    const url = Linking.useURL();

    useEffect(() => {
        if (!featureFlagEnabled) return;
        if (!url || !isConnectPopupUrl(url)) return;
        dispatch(connectPopupDeeplinkThunk({ url }));
    }, [url, featureFlagEnabled, dispatch]);

    useEffect(() => {
        if (connectPopupCall) {
            navigation.navigate(RootStackRoutes.ConnectPopup);
        }
    }, [connectPopupCall, navigation]);
};
