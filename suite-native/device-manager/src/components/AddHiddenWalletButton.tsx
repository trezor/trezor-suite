import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Translation } from '@suite-native/intl';
import { HStack, Text } from '@suite-native/atoms';
import {
    createDeviceInstanceThunk,
    selectDevice,
    selectIsDeviceProtectedByPassphrase,
} from '@suite-common/wallet-core';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@suite-common/icons';
import {
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { useDeviceManager } from '../hooks/useDeviceManager';
import { DeviceAction } from './DeviceAction';

const textStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const AddHiddenWalletButton = () => {
    const dispatch = useDispatch();

    const navigation = useNavigation<NavigationProp>();

    const { applyStyle } = useNativeStyles();

    const device = useSelector(selectDevice);
    const isPassphraseEnabledOnDevice = useSelector(selectIsDeviceProtectedByPassphrase);

    const { setIsDeviceManagerVisible } = useDeviceManager();

    const handleAddHiddenWallet = () => {
        if (!device) return;
        setIsDeviceManagerVisible(false);

        dispatch(createDeviceInstanceThunk({ device, useEmptyPassphrase: false }));

        // Create device instance thunk already handles passphrase enabling, so we just redirect to this screen and wait for success / error
        if (!isPassphraseEnabledOnDevice) {
            navigation.navigate(RootStackRoutes.PassphraseStack, {
                screen: PassphraseStackRoutes.PassphraseEnableOnDevice,
            });
        }
    };

    return (
        <DeviceAction
            testID="@device-manager/passphrase/add"
            onPress={handleAddHiddenWallet}
            flex={1}
        >
            <HStack>
                <Text variant="hint" style={applyStyle(textStyle)}>
                    <Translation id="deviceManager.deviceButtons.addHiddenWallet" />
                </Text>
                <Icon name="chevronRight" color="iconDefault" size="mediumLarge" />
            </HStack>
        </DeviceAction>
    );
};
