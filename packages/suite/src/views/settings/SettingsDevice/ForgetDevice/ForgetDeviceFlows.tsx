import { useState } from 'react';

import { goto } from '@suite/router';

import { unpairCurrentBondThunk } from 'src/actions/bluetooth/bluetoothEraseBondsThunk';

import { ConfirmationModal } from './ConfirmationModal';
import { OsAndTrezorCleanupModal } from './OsAndTrezorCleanupModal';
import { RemoveFromBluetoothSettingsModal } from './RemoveFromBluetoothSettingsModal';
import { UnplugDeviceModal } from './UnplugDeviceModal';
import { useForgetDevice } from './useForgetDevice';

export type ForgetFlowProps = {
    onCancel: () => void;
};

/**
 * Non-THP disconnected devices and THP devices with no BT history.
 * Confirmation → forget immediately.
 */
export const ImmediateForgetFlow = ({ onCancel }: ForgetFlowProps) => {
    const { dispatch, forgetDevice } = useForgetDevice();

    return (
        <ConfirmationModal
            onConfirm={() => {
                forgetDevice();
                dispatch(goto({ routeName: 'suite-index' }));
                onCancel();
            }}
            onCancel={onCancel}
            isBluetoothDevice={false}
            isBluetoothConnectedDevice={false}
        />
    );
};

/**
 * Device currently connected via cable (non-THP or THP without BT).
 * Confirmation → prompt to unplug → forget on disconnect.
 *
 * We defer the actual forget to after disconnect to avoid a race condition:
 * while the device is still plugged in, TrezorConnect fires `connectDevice`
 * which re-adds the device, and `updateSelectedDevice` re-saves it to IndexedDB.
 */
export const ConnectedCableForgetFlow = ({
    onCancel,
    isBluetoothDevice,
}: ForgetFlowProps & { isBluetoothDevice: boolean }) => {
    const [showUnplug, setShowUnplug] = useState(false);
    const { dispatch, forgetDevice } = useForgetDevice();

    if (showUnplug) {
        return (
            <UnplugDeviceModal
                onCancel={onCancel}
                onDisconnect={deviceId => {
                    forgetDevice({
                        deviceId,
                        toastType: 'device-forgotten',
                    });
                    dispatch(goto({ routeName: 'suite-index' }));
                    onCancel();
                }}
            />
        );
    }

    return (
        <ConfirmationModal
            onConfirm={() => setShowUnplug(true)}
            onCancel={onCancel}
            isBluetoothDevice={isBluetoothDevice}
            isBluetoothConnectedDevice={false}
        />
    );
};

/**
 * THP device currently connected via Bluetooth.
 * Confirmation → bleUnpair on device → Remove from BT settings modal → forget.
 */
export const ThpBtConnectedForgetFlow = ({ onCancel }: ForgetFlowProps) => {
    type Step = 'confirmation' | 'bt-removal';
    const [step, setStep] = useState<Step>('confirmation');
    const { dispatch, forgetDevice } = useForgetDevice();

    const handleConfirm = async () => {
        try {
            const result = await dispatch(unpairCurrentBondThunk({})).unwrap();

            if (!result) {
                return;
            }
        } catch {
            // bleUnpair may throw when the device disconnects mid-call.
            // The unpair has already happened on the device side,
            // so we proceed to OS removal regardless.
        }

        setStep('bt-removal');
    };

    if (step === 'bt-removal') {
        return (
            <RemoveFromBluetoothSettingsModal
                onCancel={onCancel}
                onGotIt={async () => {
                    await forgetDevice({
                        skipDisconnect: true,
                        isOsUnpairingFinished: true,
                    });
                    dispatch(goto({ routeName: 'suite-index' }));
                    onCancel();
                }}
            />
        );
    }

    return (
        <ConfirmationModal
            onConfirm={handleConfirm}
            onCancel={onCancel}
            isBluetoothDevice
            isBluetoothConnectedDevice
        />
    );
};

/**
 * THP device connected via USB cable with BT credentials.
 * Confirmation → OS + Trezor cleanup steps → prompt to unplug → forget on disconnect.
 */
export const ThpCableConnectedForgetFlow = ({ onCancel }: ForgetFlowProps) => {
    type Step = 'confirmation' | 'cleanup' | 'unplug';
    const [step, setStep] = useState<Step>('confirmation');
    const { dispatch, forgetDevice } = useForgetDevice();

    if (step === 'confirmation') {
        return (
            <ConfirmationModal
                onConfirm={() => setStep('cleanup')}
                onCancel={onCancel}
                isBluetoothDevice
                isBluetoothConnectedDevice={false}
            />
        );
    }

    if (step === 'cleanup') {
        return (
            <OsAndTrezorCleanupModal
                onCancel={onCancel}
                onTrezorRemovalConfirm={() => setStep('unplug')}
            />
        );
    }

    return (
        <UnplugDeviceModal
            onCancel={onCancel}
            onDisconnect={deviceId => {
                forgetDevice({
                    deviceId,
                    toastType: 'device-forgotten',
                    isOsUnpairingFinished: true,
                    skipDisconnect: true,
                });
                dispatch(goto({ routeName: 'suite-index' }));
                onCancel();
            }}
        />
    );
};

/**
 * THP device not connected, but has BT credentials from a previous pairing.
 * Confirmation → OS + Trezor cleanup steps → forget.
 */
export const ThpBtKnownForgetFlow = ({ onCancel }: ForgetFlowProps) => {
    const [confirmed, setConfirmed] = useState(false);
    const { forgetDevice, dispatch } = useForgetDevice();

    if (!confirmed) {
        return (
            <ConfirmationModal
                onConfirm={() => setConfirmed(true)}
                onCancel={onCancel}
                isBluetoothDevice
                isBluetoothConnectedDevice={false}
            />
        );
    }

    return (
        <OsAndTrezorCleanupModal
            onCancel={onCancel}
            onTrezorRemovalConfirm={async () => {
                await forgetDevice({
                    skipDisconnect: true,
                    toastType: 'device-forgotten',
                    isOsUnpairingFinished: true,
                });
                dispatch(goto({ routeName: 'suite-index' }));
                onCancel();
            }}
        />
    );
};
