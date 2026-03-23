import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import { runDiscoveryThunk, startDiscoveryThunk } from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type PassphraseStackParamList,
    PassphraseStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { DeviceAction } from './DeviceAction';
import { useDeviceManager } from '../hooks/useDeviceManager';

const textStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const AddHiddenWalletButton = () => {
    const analytics = useAnalytics();
    const dispatch = useDispatch();

    const navigation = useNavigation<NavigationProp>();

    const { applyStyle } = useNativeStyles();

    const device = useSelector(selectSelectedDevice);

    const { setIsDeviceManagerVisible } = useDeviceManager();

    const handleAddHiddenWallet = () => {
        if (!device) return;
        setIsDeviceManagerVisible(false);

        analytics.report({ type: events.passphraseAddHiddenWalletEvent.name });
        dispatch(
            startDiscoveryThunk({
                device,
                isAddingHiddenWallet: true,
                isAddingExistingWallet: false,
            }),
        );
        dispatch(runDiscoveryThunk(device));

        navigation.navigate(RootStackRoutes.PassphraseStack, {
            screen: PassphraseStackRoutes.PassphraseForm,
        });
    };

    return (
        <DeviceAction
            testID="@device-manager/passphrase/add"
            onPress={handleAddHiddenWallet}
            flex={1}
        >
            <HStack marginLeft="sp4">
                <Text variant="body-sm" style={applyStyle(textStyle)}>
                    <Translation id="deviceManager.deviceButtons.addHiddenWallet" />
                </Text>
                <Icon name="caretRight" size="mediumLarge" />
            </HStack>
        </DeviceAction>
    );
};
