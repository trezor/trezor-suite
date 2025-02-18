import * as deviceUtils from '@suite-common/suite-utils';
import { selectDevices, selectSelectedDevice } from '@suite-common/wallet-core';
import { WalletType } from '@suite-common/wallet-types';
import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { ForegroundAppProps } from 'src/types/suite';

import { DeviceItem } from './DeviceItem/DeviceItem';
import { SwitchDeviceModal } from './SwitchDeviceModal';
import { addWalletThunk } from '../../../actions/wallet/addWalletThunk';
import { usePassphraseModalContext } from '../../../components/suite/modals/ReduxModal/DeviceContextModal/PassphraseModalContext';
import { PassphraseWalletBestPractices } from '../../../components/suite/modals/ReduxModal/DeviceContextModal/PassphraseWalletBestPractices';

export const SwitchDevice = ({ onCancel }: ForegroundAppProps) => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const devices = useSelector(selectDevices);
    const { passphraseState, setPassphraseState, isExisting } = usePassphraseModalContext();

    const dispatch = useDispatch();
    // exclude selectedDevice from list, because other devices could have a higher priority
    // and we want to have selectedDevice on top
    const sortedDevices = deviceUtils
        .getFirstDeviceInstance(devices)
        .filter(d => !deviceUtils.isSelectedDevice(selectedDevice, d));

    // append selectedDevice at top of the list
    if (selectedDevice) {
        sortedDevices.unshift(selectedDevice);
    }

    if (selectedDevice && !isExisting && passphraseState === 'not-exist-best-practices') {
        return (
            <PassphraseWalletBestPractices
                onCancel={() => {
                    setPassphraseState('initial');
                    onCancel();
                }}
                onNext={() => {
                    dispatch(
                        addWalletThunk({
                            walletType: WalletType.PASSPHRASE,
                            device: selectedDevice,
                        }),
                    );
                    onCancel(false);
                    setPassphraseState('not-exist-enter-passphrase');
                }}
                onBack={() => {
                    setPassphraseState('initial');
                }}
                device={selectedDevice}
            />
        );
    }

    return (
        <SwitchDeviceModal isAnimationEnabled onCancel={onCancel}>
            <Column gap={spacings.xs}>
                {sortedDevices.map((device, index) => (
                    <DeviceItem
                        key={`${device.id}-${device.instance}`}
                        device={device}
                        instances={deviceUtils.getDeviceInstances(device, devices)}
                        onCancel={onCancel}
                        isFullHeaderVisible={index === 0}
                    />
                ))}
            </Column>
        </SwitchDeviceModal>
    );
};
