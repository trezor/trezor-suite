import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import { connectPopupDeeplinkThunk, selectConnectPopupCall } from '@suite-common/connect-popup';
import { selectPendingProposal, walletConnectPairThunk } from '@suite-common/walletconnect';
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

const isWalletConnectUrl = (url: string): boolean =>
    url.startsWith('trezorsuitelite://walletconnect');

// TODO: will be necessary to handle if device is not connected/unlocked so we probably want to wait until user unlock device
// we already have some modals like biometrics or coin enabled which are waiting for device to be connected
export const useConnectPopupNavigation = () => {
    const featureFlagEnabled = useFeatureFlag(FeatureFlag.IsConnectPopupEnabled);
    const featureFlagWalletConnectEnabled = useFeatureFlag(FeatureFlag.IsWalletConnectEnabled);
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch();
    const connectPopupCall = useSelector(selectConnectPopupCall);
    const walletConnectProposal = useSelector(selectPendingProposal);
    const lastProposalId = useRef<number | null>(null);

    // Handle deeplink
    const url = Linking.useURL();

    useEffect(() => {
        if (!featureFlagEnabled || !url) return;

        if (isConnectPopupUrl(url)) {
            dispatch(connectPopupDeeplinkThunk({ url }));
        } else if (featureFlagWalletConnectEnabled && isWalletConnectUrl(url)) {
            try {
                const parsedUrl = new URL(url);
                const wcUri = parsedUrl?.searchParams?.get('uri');
                if (wcUri) dispatch(walletConnectPairThunk({ uri: wcUri }));
            } catch {
                // Malformed url, ignore
            }
        }
    }, [url, featureFlagEnabled, featureFlagWalletConnectEnabled, dispatch]);

    useEffect(() => {
        if (connectPopupCall?.state === 'deeplink-callback') {
            // Note: we intentionally don't use canOpenURL here.
            // It would require us to add all possible schemes of 3rd party apps to the Info.plist
            Linking.openURL(connectPopupCall.callbackUrl);
        } else if (connectPopupCall) {
            navigation.navigate(RootStackRoutes.ConnectPopup);
        }
    }, [connectPopupCall, navigation]);
    useEffect(() => {
        if (
            walletConnectProposal &&
            !walletConnectProposal.expired &&
            walletConnectProposal.eventId !== lastProposalId.current
        ) {
            lastProposalId.current = walletConnectProposal.eventId;
            navigation.navigate(RootStackRoutes.WalletConnectSessionPopup);
        }
    }, [walletConnectProposal, navigation]);
};
