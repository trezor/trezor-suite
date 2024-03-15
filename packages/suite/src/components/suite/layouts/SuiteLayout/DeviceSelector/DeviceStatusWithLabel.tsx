import { MouseEventHandler } from 'react';
import { Image, DeviceAnimation } from '@trezor/components';
import { acquireDevice, selectDevice } from '@suite-common/wallet-core';
import styled from 'styled-components';
import * as deviceUtils from '@suite-common/suite-utils';
import { TrezorDevice } from 'src/types/suite';
import { useWalletLabeling } from '../../../labeling/WalletLabeling';
import { DeviceModelInternal } from '@trezor/connect';
import { DeviceStatusText } from 'src/views/suite/SwitchDevice/DeviceItem/DeviceStatusText';
import { selectLabelingDataForWallet } from '../../../../../reducers/suite/metadataReducer';
import { useDispatch, useSelector } from '../../../../../hooks/suite';
import { DeviceDetail } from '../../../../../views/suite/SwitchDevice/DeviceItem/DeviceDetail';

const DeviceWrapper = styled.div<{ $isLowerOpacity: boolean }>`
    display: flex;
    opacity: ${({ $isLowerOpacity }) => $isLowerOpacity && 0.4};
`;

const StyledImage = styled(Image)`
    width: 24px;

    /* do not apply the darkening filter in dark mode on device images */
    filter: none;
`;

const needsRefresh = (device?: TrezorDevice) => {
    if (!device) return false;

    const deviceStatus = deviceUtils.getStatus(device);
    const needsAcquire =
        device.type === 'unacquired' ||
        deviceStatus === 'used-in-other-window' ||
        deviceStatus === 'was-used-in-other-window';

    return needsAcquire;
};

export const DeviceStatusWithLabel = () => {
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
        <>
            <DeviceWrapper $isLowerOpacity={deviceNeedsRefresh}>
                {selectedDeviceModelInternal === DeviceModelInternal.T2B1 && (
                    <DeviceAnimation
                        type="ROTATE"
                        height="34px"
                        width="24px"
                        deviceModelInternal={selectedDeviceModelInternal}
                        deviceUnitColor={selectedDevice?.features?.unit_color}
                    />
                )}

                {selectedDeviceModelInternal !== DeviceModelInternal.T2B1 && (
                    <StyledImage alt="Trezor" image={`TREZOR_${selectedDeviceModelInternal}`} />
                )}
            </DeviceWrapper>

            <DeviceDetail label={selectedDevice.label}>
                <DeviceStatusText
                    onRefreshClick={handleRefreshClick}
                    device={selectedDevice}
                    walletLabel={
                        walletLabel === undefined || walletLabel.trim() === ''
                            ? defaultWalletLabel
                            : walletLabel
                    }
                />
            </DeviceDetail>
        </>
    );
};
