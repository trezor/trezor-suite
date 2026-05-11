import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

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

export const useHealthCheckDeeplink = () => {
    const navigation = useNavigation<NavigationProp>();

    useEffect(() => {
        const unsubscribe = addNfcIntentListener(event => {
            navigation.navigate(RootStackRoutes.DeviceSettingsStack, {
                screen: DeviceSettingsStackRoutes.HealthCheck,
                params: { ndefRecords: event.records },
            });
        });

        return unsubscribe;
    }, [navigation]);
};
