/* eslint-disable no-alert */
import { useSelector } from 'react-redux';

import { selectDevice } from '@suite-common/wallet-core';
import { Button } from '@suite-native/atoms';
import TrezorConnect from '@trezor/connect';

export const VerifyDeviceAuthenticity = () => {
    const device = useSelector(selectDevice);

    const handlePress = async () => {
        if (!device) {
            alert('No device connected');
            console.log('No device connected');
            return;
        }

        const result = await TrezorConnect.authenticateDevice({
            device: {
                path: device.path,
            },
            allowDebugKeys: true,
        });

        if (!result.success) {
            alert(`Device authenticity check failed \n${JSON.stringify(result.payload.error)}`);
            console.log('Device authenticity check failed', result.payload);
            return;
        }

        if (result.payload.valid) {
            alert('Device is authentic');
            console.log('Device is authentic', result.payload);
            return;
        }

        alert(`Device is not authentic\n ${JSON.stringify(result.payload)}`);
        console.log('Device is not authentic', result.payload);
    };

    return <Button onPress={handlePress}>Verify Device Authenticity</Button>;
};
