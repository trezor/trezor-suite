import { useDispatch, useSelector } from 'react-redux';

import { Translation } from '@suite-native/intl';
import { createDeviceInstance, selectDevice } from '@suite-common/wallet-core';
import { Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@suite-common/icons';

import { useDeviceManager } from '../hooks/useDeviceManager';
import { DeviceAction } from './DeviceAction';

const textStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

export const AddHiddenWalletButton = () => {
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();

    const device = useSelector(selectDevice);

    const { setIsDeviceManagerVisible } = useDeviceManager();

    const handleAddHiddenWallet = () => {
        if (!device) return;

        setIsDeviceManagerVisible(false);
        dispatch(createDeviceInstance({ device }));
    };

    return (
        <DeviceAction
            testID="@device-manager/passphrase/add"
            onPress={handleAddHiddenWallet}
            flex={1}
        >
            <Text variant="hint" style={applyStyle(textStyle)}>
                <Translation id="deviceManager.deviceButtons.addHiddenWallet" />
            </Text>
            <Icon name="chevronRight" color="iconDefault" size="mediumLarge" />
        </DeviceAction>
    );
};
