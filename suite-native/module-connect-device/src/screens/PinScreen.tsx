import { useSelector } from 'react-redux';

import { Image, VStack } from '@suite-native/atoms';
import { DeviceModelInternal } from '@trezor/connect';
import { selectDeviceModel } from '@suite-common/wallet-core';

import { ConnectDeviceSreenView } from '../components/ConnectDeviceSreenView';
import { PinForm } from '../components/PinForm';
import { PinOnDevice, deviceImageMap } from '../components/PinOnDevice';

export const PinScreen = () => {
    const deviceModel = useSelector(selectDeviceModel);

    if (!deviceModel) return null;

    return (
        <ConnectDeviceSreenView>
            {deviceModel === DeviceModelInternal.T1B1 ? (
                <VStack spacing="medium" alignItems="center" flex={1} marginTop="large">
                    <Image source={deviceImageMap[deviceModel]} width={161} height={194} />
                    <PinForm />
                </VStack>
            ) : (
                <PinOnDevice deviceModel={deviceModel} />
            )}
        </ConnectDeviceSreenView>
    );
};
