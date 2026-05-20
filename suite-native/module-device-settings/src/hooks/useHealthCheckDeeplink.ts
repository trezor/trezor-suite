import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import {
    DeviceSettingsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { addNfcIntentListener } from '@trezor/react-native-nfc';

type NavigationProp = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.DeviceSettingsStack,
    RootStackParamList
>;

const isHealthCheckUrl = (url: string): boolean =>
    /\/suite\/deeplinks\/health-check/.test(url) || url.startsWith('trezorsuite://health-check');

const navigateToHealthCheck = (navigation: NavigationProp, ndefRecords?: unknown[]) => {
    navigation.navigate(RootStackRoutes.DeviceSettingsStack, {
        screen: DeviceSettingsStackRoutes.HealthCheck,
        params: { ndefRecords: ndefRecords ?? [] },
    });
};

export const useHealthCheckDeeplink = () => {
    const navigation = useNavigation<NavigationProp>();

    // Android: NFC intents deliver NDEF records directly via the native module.
    useEffect(() => {
        if (Platform.OS !== 'android') return;

        const unsubscribe = addNfcIntentListener(event => {
            navigateToHealthCheck(navigation, event.records);
        });

        return unsubscribe;
    }, [navigation]);

    // iOS: Background Tag Reading opens the app via a Universal Link.
    // The URL just navigates to the screen — actual tag reading happens
    // via startScanSession() on the HealthCheckScreen.
    const url = Linking.useURL();

    useEffect(() => {
        if (url && isHealthCheckUrl(url)) {
            navigateToHealthCheck(navigation);
        }
    }, [url, navigation]);
};
