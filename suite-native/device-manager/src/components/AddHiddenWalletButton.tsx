import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    runDiscoveryThunk,
    selectIsDeviceProtectedByPassphrase,
    selectSelectedDevice,
    startDiscoveryThunk,
} from '@suite-common/wallet-core';
import { EventType, analytics } from '@suite-native/analytics';
import { HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { DeviceAction } from './DeviceAction';
import { useDeviceManager } from '../hooks/useDeviceManager';

const textStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const AddHiddenWalletButton = () => {
    const dispatch = useDispatch();

    const navigation = useNavigation<NavigationProp>();

    const { applyStyle } = useNativeStyles();

    const device = useSelector(selectSelectedDevice);
    const isPassphraseEnabledOnDevice = useSelector(selectIsDeviceProtectedByPassphrase);

    const { setIsDeviceManagerVisible } = useDeviceManager();

    const handleAddHiddenWallet = () => {
        if (!device) return;
        setIsDeviceManagerVisible(false);

        analytics.report({ type: EventType.PassphraseAddHiddenWallet });

        // If passphrase is not enabled on the device, we need to show the enable screen first
        if (!isPassphraseEnabledOnDevice) {
            analytics.report({ type: EventType.PassphraseNotEnabled });
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.PassphraseEnableOnDevice,
            });
        } else {
            dispatch(
                startDiscoveryThunk({
                    device,
                    isAddingHiddenWallet: true,
                    isAddingExistingWallet: false,
                }),
            );
            dispatch(runDiscoveryThunk(device));
            // Navigate to the PassphraseStackNavigator which will handle showing the appropriate screen
            // based on the current state of the passphrase flow
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.PassphraseForm,
            });
        }
    };

    return (
        <DeviceAction
            testID="@device-manager/passphrase/add"
            onPress={handleAddHiddenWallet}
            flex={1}
        >
            <HStack marginLeft="sp4">
                <Text variant="hint" style={applyStyle(textStyle)}>
                    <Translation id="deviceManager.deviceButtons.addHiddenWallet" />
                </Text>
                <Icon name="caretRight" size="mediumLarge" />
            </HStack>
        </DeviceAction>
    );
};
