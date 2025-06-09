import { useCallback } from 'react';

import * as deviceUtils from '@suite-common/suite-utils';
import { selectDevices } from '@suite-common/wallet-core';
import { Button, Column, Icon, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { ForegroundAppProps } from 'src/types/suite';

import { DeviceItem } from './DeviceItem/DeviceItem';
import { SwitchDeviceModal } from './SwitchDeviceModal';
import { setBluetoothListOpen } from '../../../actions/bluetooth/desktopBluetoothReducer';
import { selectIsBluetoothListOpen } from '../../../actions/bluetooth/desktopBluetoothSelectors';
import { BluetoothConnect } from '../../../components/suite/bluetooth/BluetoothConnect';
import { selectSuiteFlags } from '../../../reducers/suite/suiteReducer';

export const SwitchDevice = ({
    cancelable,
    isAddingHiddenWalletWithRespectToSettings,
    onCancel,
}: ForegroundAppProps) => {
    const { isBluetoothEnabled } = useSelector(selectSuiteFlags);
    const isBluetoothMode = useSelector(selectIsBluetoothListOpen);
    const dispatch = useDispatch();

    const devices = useSelector(selectDevices);

    // exclude selectedDevice from list, because other devices could have a higher priority,
    // and we want to have selectedDevice on top
    const sortedDevices = deviceUtils.getFirstDeviceInstance(devices, {
        sortingFn: deviceUtils.sortDevicesForDeviceList,
    });

    const openBluetoothList = () => {
        dispatch(setBluetoothListOpen({ isOpen: true }));
    };

    const handleCancel = useCallback(() => {
        if (cancelable) {
            onCancel();
        }
    }, [cancelable, onCancel]);

    return (
        <SwitchDeviceModal isAnimationEnabled onCancel={handleCancel}>
            {isBluetoothMode ? (
                <BluetoothConnect uiMode="card" />
            ) : (
                <Column gap={spacings.md}>
                    {sortedDevices.map((device, index) => (
                        <DeviceItem
                            key={`${device.id}-${device.instance}`}
                            cancelable={cancelable}
                            device={device}
                            isAddingHiddenWalletWithRespectToSettings={
                                isAddingHiddenWalletWithRespectToSettings
                            }
                            instances={deviceUtils.getDeviceInstances(device, devices)}
                            onCancel={handleCancel}
                            isFullHeaderVisible={index === 0}
                        />
                    ))}
                    {isBluetoothEnabled && (
                        <Button variant="tertiary" isFullWidth onClick={openBluetoothList}>
                            <Row justifyContent="center" alignItems="center" gap={spacings.xs}>
                                <Icon name="bluetooth" size="mediumLarge" />
                                <Text typographyStyle="body">Pair Trezor Safe 7</Text>
                            </Row>
                        </Button>
                    )}
                </Column>
            )}
        </SwitchDeviceModal>
    );
};
