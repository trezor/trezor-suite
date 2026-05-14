import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { selectDeviceTotalFiatBalanceByDeviceState } from '@suite-native/device';

import { WalletItemBase } from './WalletItemBase';

type WalletItemProps = {
    onPress: () => void;
    device: TrezorDevice;
    isSelectable?: boolean;
};

export const WalletItem = ({ onPress, device, isSelectable = true }: WalletItemProps) => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const baseCurrencyAmount = useSelector((state: any) =>
        device?.state?.staticSessionId
            ? selectDeviceTotalFiatBalanceByDeviceState(state, device?.state?.staticSessionId)
            : undefined,
    );

    if (!device) {
        return null;
    }

    const isSelected =
        selectedDevice?.id === device.id && selectedDevice?.instance === device.instance;

    const showAsSelected = isSelected && isSelectable;

    if (!device?.state?.staticSessionId) {
        console.warn('device is not authorized, this will yield unexpected wallet type');
    }

    return (
        <WalletItemBase
            variant={device.useEmptyPassphrase ? 'standard' : 'passphrase'}
            onPress={onPress}
            isSelectable={isSelectable}
            isSelected={showAsSelected}
            device={device}
            baseCurrencyAmount={baseCurrencyAmount}
        />
    );
};
