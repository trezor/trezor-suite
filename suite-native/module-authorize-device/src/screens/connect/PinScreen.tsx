import { useSelector } from 'react-redux';

import { Image, VStack } from '@suite-native/atoms';
import { DeviceModelInternal } from '@trezor/connect';
import { selectDeviceModel } from '@suite-common/wallet-core';

import { ConnectDeviceScreenView } from '../../components/connect/ConnectDeviceScreenView';
import { PinForm } from '../../components/connect/PinForm';
import { PinOnDevice, deviceImageMap } from '../../components/connect/PinOnDevice';

export const PinScreen = () => {
    const deviceModel = useSelector(selectDeviceModel);

    if (!deviceModel) return null;

    return (
        <ConnectDeviceScreenView>
            {deviceModel === DeviceModelInternal.T1B1 ? (
                <VStack spacing="sp16" alignItems="center" flex={1} marginTop="sp24">
                    <Image source={deviceImageMap[deviceModel]} width={161} height={194} />
                    <PinForm />
                </VStack>
            ) : (
                <PinOnDevice deviceModel={deviceModel} />
            )}
        </ConnectDeviceScreenView>
    );
};
