import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

import { Box, Button, Text } from '@suite-native/atoms';
import { useNativeStyles } from '@trezor/styles';
import {
    createDeviceInstance,
    selectDevice,
    selectDeviceButtonRequestsCodes,
    selectDeviceFeatures,
} from '@suite-common/wallet-core';

import { formStyle } from './PassphraseForm';

export const PassphraseNotEnabled = () => {
    const dispatch = useDispatch();

    const device = useSelector(selectDevice);
    const deviceFeatures = useSelector(selectDeviceFeatures);
    const buttonRequests = useSelector(selectDeviceButtonRequestsCodes);

    const [shouldCheckDevice, setShouldCheckDevice] = useState(false);

    const { applyStyle } = useNativeStyles();

    useEffect(() => {
        if (buttonRequests.includes('ButtonRequest_ProtectCall')) {
            setShouldCheckDevice(true);
        }
    }, [buttonRequests, deviceFeatures?.passphrase_protection]);

    if (!device) return null;

    const handleEnablePassphrase = () => {
        dispatch(createDeviceInstance({ device }));
    };

    return (
        <Box style={applyStyle(formStyle)} padding={'extraLarge'}>
            <Text textAlign={'center'}>
                {shouldCheckDevice ? 'Check you device and act' : 'Passphrase not enabled'}
            </Text>
            {!shouldCheckDevice && (
                <Button onPress={handleEnablePassphrase}>Enable passphrase</Button>
            )}
        </Box>
    );
};
