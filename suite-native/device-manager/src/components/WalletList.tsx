import { useSelector } from 'react-redux';

import { selectDeviceInstances } from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';
import { TrezorDevice } from '@suite-common/suite-types';

import { WalletItem } from './WalletItem';

type WalletListProps = {
    onSelectDevice: (device: TrezorDevice) => void;
};

export const WalletList = ({ onSelectDevice }: WalletListProps) => {
    const devices = useSelector(selectDeviceInstances);

    // If there are less than 2 device instances(wallets), do not show wallet list
    if (devices.length < 2) {
        return null;
    }

    return (
        <VStack spacing={12} paddingHorizontal="medium">
            {devices.map(device => {
                if (!device.state) {
                    return null;
                }

                return (
                    <WalletItem
                        key={device.state}
                        deviceState={device.state}
                        isSelectable={devices.length > 1}
                        onPress={() => onSelectDevice(device)}
                    />
                );
            })}
        </VStack>
    );
};
