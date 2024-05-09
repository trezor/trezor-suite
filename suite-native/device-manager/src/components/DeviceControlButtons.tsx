import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { analytics, EventType } from '@suite-native/analytics';
import { Box, Button, HStack } from '@suite-native/atoms';
import { deviceActions, selectDevice } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';
import {
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { useDeviceManager } from '../hooks/useDeviceManager';

type NavigationProp = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.AppTabs,
    RootStackParamList
>;

export const DeviceControlButtons = () => {
    const selectedDevice = useSelector(selectDevice);

    const { setIsDeviceManagerVisible } = useDeviceManager();

    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch();

    if (!selectedDevice) return null;

    const handleEject = () => {
        setIsDeviceManagerVisible(false);
        dispatch(deviceActions.deviceDisconnect(selectedDevice));
        analytics.report({
            type: EventType.EjectDeviceClick,
            payload: { origin: 'deviceManager' },
        });
    };

    const handleDeviceRedirect = () => {
        setIsDeviceManagerVisible(false);
        navigation.navigate(RootStackRoutes.DeviceInfo);
        analytics.report({ type: EventType.DeviceManagerClick, payload: { action: 'deviceInfo' } });
    };

    return (
        <HStack>
            <Box flex={1}>
                <Button colorScheme="redElevation1" viewLeft="eject" onPress={handleEject}>
                    <Translation id="deviceManager.deviceButtons.eject" />
                </Button>
            </Box>
            <Box flex={2}>
                <Button colorScheme="tertiaryElevation1" onPress={handleDeviceRedirect}>
                    <Translation id="deviceManager.deviceButtons.deviceInfo" />
                </Button>
            </Box>
        </HStack>
    );
};
