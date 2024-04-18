import { MouseEventHandler } from 'react';
import { acquireDevice, selectDevice } from '@suite-common/wallet-core';
import * as deviceUtils from '@suite-common/suite-utils';
import { TrezorDevice } from 'src/types/suite';
import { useWalletLabeling } from '../../../labeling/WalletLabeling';
import { selectLabelingDataForWallet } from '../../../../../reducers/suite/metadataReducer';
import { useDispatch, useSelector } from '../../../../../hooks/suite';
import { DeviceStatus } from './DeviceStatus';

const needsRefresh = (device?: TrezorDevice) => {
    if (!device) return false;

    const deviceStatus = deviceUtils.getStatus(device);
    const needsAcquire =
        device.type === 'unacquired' ||
        deviceStatus === 'used-in-other-window' ||
        deviceStatus === 'was-used-in-other-window';

    return needsAcquire;
};

export const SidebarDeviceStatus = () => {
    const selectedDevice = useSelector(selectDevice);

    const dispatch = useDispatch();

    const { walletLabel } = useSelector(state =>
        selectLabelingDataForWallet(state, selectedDevice?.state),
    );
    const deviceNeedsRefresh = needsRefresh(selectedDevice);
    const { defaultAccountLabelString } = useWalletLabeling();

    const defaultWalletLabel =
        selectedDevice !== undefined
            ? defaultAccountLabelString({ device: selectedDevice })
            : undefined;

    const handleRefreshClick: MouseEventHandler = e => {
        e.stopPropagation();
        if (deviceNeedsRefresh) {
            dispatch(acquireDevice(selectedDevice));
        }
    };

    const selectedDeviceModelInternal = selectedDevice?.features?.internal_model;

    if (!selectedDevice || !selectedDeviceModelInternal) {
        return null;
    }

    return (
        <DeviceStatus
            deviceModel={selectedDeviceModelInternal}
            deviceNeedsRefresh={deviceNeedsRefresh}
            device={selectedDevice}
            handleRefreshClick={handleRefreshClick}
            walletLabel={
                walletLabel === undefined || walletLabel.trim() === ''
                    ? defaultWalletLabel
                    : walletLabel
            }
        />
    );
};
