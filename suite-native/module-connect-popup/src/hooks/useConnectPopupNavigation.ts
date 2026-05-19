import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import { connectPopupDeeplinkThunk, selectConnectPopupCall } from '@suite-common/connect-popup';
import { selectPendingProposal, walletConnectPairThunk } from '@suite-common/walletconnect';
import { isDevelopOrDebugEnv } from '@suite-native/config';
import {
    type RootStackParamList,
    RootStackRoutes,
    SettingsStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.ConnectPopup,
    RootStackParamList
>;

const isConnectPopupUrl = (url: string): boolean => {
    if (isDevelopOrDebugEnv()) {
        if (url.startsWith('trezorsuite://connect')) return true;
        if (/^https:\/\/dev\.suite\.sldev\.cz\/connect\/(.*)\/deeplink(.*)$/g.test(url))
            return true;
    }
    if (/^https:\/\/connect\.trezor\.io\/\d+\/deeplink(.*)$/.test(url)) return true;

    return false;
};

const isWalletConnectUrl = (url: string): boolean =>
    url.startsWith('trezorsuite://walletconnect') ||
    /^https:\/\/connect\.trezor\.io\/\d+\/deeplink\/wc/.test(url);

const GUIDE_SUPPORT_URL_PREFIX = 'trezorsuite://guide-support';

const isGuideSupportUrl = (url: string): boolean => url.startsWith(GUIDE_SUPPORT_URL_PREFIX);

// TODO: will be necessary to handle if device is not connected/unlocked so we probably want to wait until user unlock device
// we already have some modals like biometrics or coin enabled which are waiting for device to be connected
export const useConnectPopupNavigation = () => {
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch();
    const connectPopupCall = useSelector(selectConnectPopupCall);
    const walletConnectProposal = useSelector(selectPendingProposal);
    const lastProposalId = useRef<number | null>(null);

    // Handle deeplink
    const url = Linking.useURL();

    useEffect(() => {
        if (url && isWalletConnectUrl(url)) {
            try {
                const parsedUrl = new URL(url);
                const wcUri = parsedUrl?.searchParams?.get('uri');
                if (wcUri) dispatch(walletConnectPairThunk({ uri: wcUri }));
            } catch {
                // Malformed url, ignore
            }
        } else if (url && isConnectPopupUrl(url)) {
            dispatch(connectPopupDeeplinkThunk({ url }));
        }
    }, [url, dispatch]);

    // Guide-support deeplinks are handled via a direct Linking.addEventListener rather than the
    // Linking.useURL() state hook. This ensures every deeplink invocation triggers navigation,
    // including repeated calls with the same URL while the app is running in the background
    // (Linking.useURL() would not update its state in that case, so the effect would not re-fire).
    const handleGuideSupportUrl = useCallback(
        (rawUrl: string) => {
            try {
                const parsedUrl = new URL(rawUrl);
                const shareSystemInfo = parsedUrl.searchParams.get('shareSystemInfo') === '1';
                navigation.navigate(RootStackRoutes.SettingsScreenStack, {
                    screen: SettingsStackRoutes.SettingsSupport,
                    params: { autoOpenContactSupport: true, shareSystemInfo },
                });
            } catch {
                // Malformed url, ignore
            }
        },
        [navigation],
    );

    useEffect(() => {
        // Cold-start: check whether the app was opened with a guide-support URL.
        Linking.getInitialURL().then(initialUrl => {
            if (initialUrl && isGuideSupportUrl(initialUrl)) {
                handleGuideSupportUrl(initialUrl);
            }
        });

        // Background: subscribe to URL events so every invocation navigates,
        // even when the same URL is re-used and Linking.useURL() would not re-fire.
        const subscription = Linking.addEventListener('url', ({ url: eventUrl }) => {
            if (isGuideSupportUrl(eventUrl)) {
                handleGuideSupportUrl(eventUrl);
            }
        });

        return () => subscription.remove();
    }, [handleGuideSupportUrl]);

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
