import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, HStack } from '@suite-native/atoms';
import { deviceActions, selectDevice } from '@suite-common/wallet-core';
import { useTranslate } from '@suite-native/intl';
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

    const { translate } = useTranslate();

    if (!selectedDevice) return null;

    const handleEject = () => {
        setIsDeviceManagerVisible(false);
        dispatch(deviceActions.deviceDisconnect(selectedDevice));
    };

    const handleDeviceRedirect = () => {
        setIsDeviceManagerVisible(false);
        navigation.navigate(RootStackRoutes.DeviceInfo);
    };

    return (
        <HStack>
            <Box flex={1}>
                <Button colorScheme="dangerElevation1" iconLeft="eject" onPress={handleEject}>
                    {translate('deviceManager.deviceButtons.eject')}
                </Button>
            </Box>
            <Box flex={2}>
                <Button colorScheme="tertiaryElevation1" onPress={handleDeviceRedirect}>
                    {translate('deviceManager.deviceButtons.deviceInfo')}
                </Button>
            </Box>
        </HStack>
    );
};
