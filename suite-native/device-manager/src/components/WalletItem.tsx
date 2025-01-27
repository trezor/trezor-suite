import { useSelector } from 'react-redux';

import { TrezorDevice } from '@suite-common/suite-types';
import { selectDeviceByState, selectSelectedDevice } from '@suite-common/wallet-core';
import { selectDeviceTotalFiatBalanceByDeviceState } from '@suite-native/device';

import { WalletItemBase } from './WalletItemBase';

type WalletItemProps = {
    onPress: () => void;
    deviceState: NonNullable<TrezorDevice['state']>;
    isSelectable?: boolean;
};

export const WalletItem = ({ onPress, deviceState, isSelectable = true }: WalletItemProps) => {
    const device = useSelector((state: any) => selectDeviceByState(state, deviceState));
    const selectedDevice = useSelector(selectSelectedDevice);
    const fiatBalance = useSelector((state: any) =>
        device?.state?.staticSessionId
            ? String(
                  selectDeviceTotalFiatBalanceByDeviceState(state, device?.state?.staticSessionId),
              )
            : undefined,
    );

    if (!device) {
        return null;
    }

    const isSelected =
        selectedDevice?.id === device.id && selectedDevice?.instance === device.instance;

    const showAsSelected = isSelected && isSelectable;

    return (
        <WalletItemBase
            variant={device.useEmptyPassphrase ? 'standard' : 'passphrase'}
            onPress={onPress}
            isSelectable={isSelectable}
            isSelected={showAsSelected}
            walletNumber={device.walletNumber}
            fiatBalance={fiatBalance}
        />
    );
};
