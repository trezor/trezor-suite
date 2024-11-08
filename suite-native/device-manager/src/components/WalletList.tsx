import { useSelector, useDispatch } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { TrezorDevice } from '@suite-common/suite-types';
import {
    createDeviceInstanceThunk,
    selectDevice,
    selectDeviceInstances,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';
import { selectHasNoDeviceWithEmptyPassphrase } from '@suite-native/device';

import { WalletItem } from './WalletItem';
import { WalletItemBase } from './WalletItemBase';

type WalletListProps = {
    onSelectDevice: (device: TrezorDevice) => void;
};

export const WalletList = ({ onSelectDevice }: WalletListProps) => {
    const dispatch = useDispatch();
    const devices = useSelector(selectDeviceInstances);
    const selectedDevice = useSelector(selectDevice);
    const hasNoDeviceWithEmptyPassphrase = useSelector(selectHasNoDeviceWithEmptyPassphrase);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const isSelectable = devices.length > 1 || hasNoDeviceWithEmptyPassphrase;

    // we want to show placeholder in case there are only passphrase wallets without standard and not portfolio
    const showPlaceholder =
        hasNoDeviceWithEmptyPassphrase && A.isNotEmpty(devices) && !isPortfolioTrackerDevice;

    // on tap of placeholder we actually create device with empty passphrase and select it
    const handlePlaceholderPress = async () => {
        if (selectedDevice) {
            await dispatch(
                createDeviceInstanceThunk({
                    device: selectedDevice,
                    useEmptyPassphrase: true,
                }),
            )
                .unwrap()
                .then(result => onSelectDevice(result.device));
        }
    };

    return (
        <VStack spacing="sp12" paddingHorizontal="sp16">
            {showPlaceholder && (
                <WalletItemBase
                    variant="standard"
                    onPress={handlePlaceholderPress}
                    isSelectable
                    isSelected={false}
                />
            )}
            {devices.map(device => {
                if (!device.state) {
                    return null;
                }

                return (
                    <WalletItem
                        key={device.state.staticSessionId}
                        deviceState={device.state}
                        isSelectable={isSelectable}
                        onPress={() => onSelectDevice(device)}
                    />
                );
            })}
        </VStack>
    );
};
