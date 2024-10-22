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
import { Icon } from '@suite-native/icons';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { EventType, analytics } from '@suite-native/analytics';

import { useDeviceManager } from '../hooks/useDeviceManager';
import { DeviceAction } from './DeviceAction';

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

    const device = useSelector(selectDevice);
    const isPassphraseEnabledOnDevice = useSelector(selectIsDeviceProtectedByPassphrase);

    const { setIsDeviceManagerVisible } = useDeviceManager();

    const handleAddHiddenWallet = () => {
        if (!device) return;
        setIsDeviceManagerVisible(false);

        analytics.report({ type: EventType.PassphraseAddHiddenWallet });

        dispatch(createDeviceInstanceThunk({ device, useEmptyPassphrase: false }));

        // Create device instance thunk already handles passphrase enabling, so we just redirect to this screen and wait for success / error
        if (!isPassphraseEnabledOnDevice) {
            analytics.report({ type: EventType.PassphraseNotEnabled });
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.PassphraseEnableOnDevice,
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
