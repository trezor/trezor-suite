import { useDispatch, useSelector } from 'react-redux';

import TrezorConnect from '@trezor/connect';
import { Box, HStack, Switch, Text } from '@suite-native/atoms';
import {
    removeButtonRequests,
    selectDevice,
    selectDeviceButtonRequestsCodes,
    selectIsDeviceProtectedByPassphrase,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { useToast } from '@suite-native/toasts';

export const DevicePassphraseSwitch = () => {
    const dispatch = useDispatch();
    const device = useSelector(selectDevice);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const isPassphraseEnabled = useSelector(selectIsDeviceProtectedByPassphrase);
    const { showToast } = useToast();
    const buttonRequestCodes = useSelector(selectDeviceButtonRequestsCodes);

    const shouldCheckDevice = buttonRequestCodes?.some(
        code => code === 'ButtonRequest_ProtectCall',
    );

    if (!device || isPortfolioTrackerDevice) return null;

    const handleTogglePassphrase = async () => {
        if (!device) return;

        const response = await TrezorConnect.applySettings({
            device: {
                path: device.path,
            },
            use_passphrase: !isPassphraseEnabled,
        });

        const toastMessage = response.success ? 'Success' : `Error: ${response.payload.error}`;

        showToast({
            variant: 'default',
            message: toastMessage,
            icon: 'check',
        });

        dispatch(removeButtonRequests({ device }));
    };

    return (
        <Box>
            <HStack justifyContent="space-between">
                <Text>Is passphrasse enabled</Text>
                <Switch isChecked={isPassphraseEnabled} onChange={handleTogglePassphrase} />
            </HStack>
            {shouldCheckDevice && <Text>Confirm on device</Text>}
        </Box>
    );
};
