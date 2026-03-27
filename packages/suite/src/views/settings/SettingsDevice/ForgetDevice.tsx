import { useEffect, useRef, useState } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { selectKnownDeviceByDeviceId } from '@suite-common/bluetooth/src/bluetoothSelectors';
import { selectPersistentDeviceDataById, selectSelectedDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import * as deviceUtils from '@suite-common/suite-utils';
import { getIsDeviceConnectedViaBluetooth, getIsThpDevice } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button, Card, Column, Icon, List, Modal, Paragraph } from '@trezor/components';
import TrezorConnect, { DEVICE, DEVICE_EVENT, type DeviceEventMessage } from '@trezor/connect';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { exhaustive } from '@trezor/type-utils';

import { unpairCurrentBondThunk } from 'src/actions/bluetooth/bluetoothEraseBondsThunk';
import { openSystemSettingsThunk } from 'src/actions/bluetooth/openSystemSettingsThunk';
import { suiteForgetDeviceThunk } from 'src/actions/suite/suiteForgetDeviceThunk';
import { TrezorLink } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

import { DisconnectTrezorSvg } from './DisconnectTrezorSvg';
import { StepCard } from './WipeDevice/WipeDeviceModal';

/**
 * Resolved device state for the forget/unpair flow.
 *
 * - `non-thp-connected`: Legacy device connected via cable — forget + prompt to unplug.
 * - `non-thp-disconnected`: Legacy device not connected — forget immediately.
 * - `thp-cable-connected`: THP device connected via USB cable — forget + OS/Trezor cleanup.
 * - `thp-bt-connected`: THP device connected via Bluetooth — bleUnpair, then OS removal.
 * - `thp-bt-known`: THP device not connected, but has BT credentials — OS + Trezor removal steps.
 * - `thp-disconnected`: THP device not connected and no BT credentials — forget immediately.
 */
type ForgetDeviceState =
    | 'non-thp-connected'
    | 'non-thp-disconnected'
    | 'thp-cable-connected'
    | 'thp-bt-connected'
    | 'thp-bt-known'
    | 'thp-disconnected';

const resolveForgetDeviceState = (
    device: TrezorDevice,
    { hasBluetoothCredentials }: { hasBluetoothCredentials: boolean },
): ForgetDeviceState => {
    const isThp = getIsThpDevice(device);

    if (!isThp) {
        return device.connected ? 'non-thp-connected' : 'non-thp-disconnected';
    }

    if (getIsDeviceConnectedViaBluetooth(device)) {
        return 'thp-bt-connected';
    }

    if (device.connected) {
        return hasBluetoothCredentials ? 'thp-cable-connected' : 'non-thp-connected';
    }

    if (hasBluetoothCredentials) {
        return 'thp-bt-known';
    }

    return 'thp-disconnected';
};

// --- Shared UI pieces ---

type ForgetFlowProps = {
    onCancel: () => void;
};

/**
 * Hook that wraps `forgetDeviceThunk` with toast and analytics.
 * Accepts an optional `device` param for cases where the selected device
 * is no longer available (e.g. after disconnect).
 */
const useForgetDevice = () => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();

    const forgetDevice = async ({
        skipToggleModalConnection,
        isOsUnpairingFinished,
        skipDisconnect,
        deviceId,
        toastType = 'device-forgotten',
    }: {
        skipToggleModalConnection?: boolean;
        isOsUnpairingFinished?: boolean;
        skipDisconnect?: boolean;
        deviceId?: string;
        toastType?: 'device-forgotten' | null;
    } = {}) => {
        await dispatch(
            suiteForgetDeviceThunk({
                skipToggleModalConnection: Boolean(skipToggleModalConnection),
                isOsUnpairingFinished: Boolean(isOsUnpairingFinished),
                skipDisconnect: Boolean(skipDisconnect),
                deviceId,
            }),
        );

        if (toastType) {
            dispatch(notificationsActions.addToast({ type: toastType }));
        }
        analytics.report({ type: events.switchDeviceForgetEvent.name });
    };

    return { forgetDevice, dispatch };
};

const ConfirmationContent = ({
    isBluetoothDevice,
    isBluetoothConnectedDevice,
}: {
    isBluetoothDevice: boolean;
    isBluetoothConnectedDevice: boolean;
}) => (
    <Card paddingType="normal">
        <List gap={24}>
            <List.Item bulletComponent={<Icon name="linkBreak" priority="secondary" size={20} />}>
                <Paragraph intent="neutral" priority="secondary">
                    <Translation id="TR_FORGET_DEVICE_MODAL_BULLET_FORGET" />
                </Paragraph>
            </List.Item>
            {isBluetoothDevice && (
                <List.Item
                    bulletComponent={<Icon name="bluetoothSlash" priority="secondary" size={20} />}
                >
                    <Paragraph intent="neutral" priority="secondary">
                        {isBluetoothConnectedDevice ? (
                            <Translation id="TR_FORGET_DEVICE_MODAL_BLUETOOTH_REMOVED_AND_DISCONNECTED" />
                        ) : (
                            <Translation id="TR_FORGET_DEVICE_MODAL_BLUETOOTH_REMOVED" />
                        )}
                    </Paragraph>
                </List.Item>
            )}
            <List.Item bulletComponent={<Icon name="scroll" priority="secondary" size={20} />}>
                <Paragraph intent="neutral" priority="secondary">
                    <Translation id="TR_FORGET_DEVICE_MODAL_BULLET_NOT_WIPE" />
                </Paragraph>
            </List.Item>
        </List>
    </Card>
);

const ConfirmationModal = ({
    onConfirm,
    onCancel,
    isBluetoothDevice,
    isBluetoothConnectedDevice,
}: {
    onConfirm: () => void;
    onCancel: () => void;
    isBluetoothDevice: boolean;
    isBluetoothConnectedDevice: boolean;
}) => (
    <Modal
        onCancel={onCancel}
        heading={<Translation id="TR_FORGET_DEVICE_MODAL_HEADING" />}
        intent="warning"
        width={680}
        bottomContent={
            <>
                <Modal.Button onClick={onConfirm}>
                    <Translation id="TR_FORGET_DEVICE_MODAL_CONFIRM" />
                </Modal.Button>
                <Modal.Button intent="neutral" priority="secondary" onClick={onCancel}>
                    <Translation id="TR_CANCEL" />
                </Modal.Button>
            </>
        }
    >
        <ConfirmationContent
            isBluetoothDevice={isBluetoothDevice}
            isBluetoothConnectedDevice={isBluetoothConnectedDevice}
        />
    </Modal>
);

const OsAndTrezorCleanupModal = ({
    onCancel,
    onTrezorRemovalConfirm,
}: {
    onCancel: () => void;
    onTrezorRemovalConfirm: () => void;
}) => {
    const [osRemovalConfirmed, setOsRemovalConfirmed] = useState(false);
    const dispatch = useDispatch();

    const handleOpenBluetoothSettings = () => {
        dispatch(openSystemSettingsThunk({ type: 'bluetooth' }));
    };

    return (
        <Modal
            onCancel={onCancel}
            heading={<Translation id="TR_FORGET_DEVICE_MODAL_FINISH_HEADING" />}
            width={600}
        >
            <Column gap={16}>
                <StepCard
                    descriptionTypographyStyle="inherit"
                    heading={<Translation id="TR_FORGET_DEVICE_MODAL_ON_YOUR_COMPUTER" />}
                    description={
                        <Translation
                            id="TR_FORGET_DEVICE_MODAL_REMOVE_FROM_OS"
                            values={{
                                b: chunks => <b>{chunks}</b>,
                                link: chunks => (
                                    <TrezorLink
                                        onClick={event => {
                                            event.preventDefault();
                                            handleOpenBluetoothSettings();
                                        }}
                                    >
                                        {chunks}
                                    </TrezorLink>
                                ),
                            }}
                        />
                    }
                    actions={
                        <Button
                            intent="brand"
                            onClick={() => setOsRemovalConfirmed(true)}
                            size="large"
                        >
                            <Translation id="TR_FORGET_DEVICE_MODAL_IVE_REMOVED_IT" />
                        </Button>
                    }
                    icon="laptop"
                    state={osRemovalConfirmed ? 'confirmed' : 'default'}
                />
                <StepCard
                    descriptionTypographyStyle="inherit"
                    heading={<Translation id="TR_FORGET_DEVICE_MODAL_ON_YOUR_TREZOR" />}
                    description={
                        <Translation
                            id="TR_FORGET_DEVICE_MODAL_REMOVE_FROM_TREZOR"
                            values={{
                                b: chunks => <b>{chunks}</b>,
                            }}
                        />
                    }
                    actions={
                        <Button intent="brand" onClick={onTrezorRemovalConfirm} size="large">
                            <Translation id="TR_FORGET_DEVICE_MODAL_IVE_REMOVED_IT" />
                        </Button>
                    }
                    icon="trezorSafe7"
                    state={osRemovalConfirmed ? 'default' : 'pending'}
                />
            </Column>
        </Modal>
    );
};

/**
 * Prompts the user to unplug the device. Calls `onDisconnect` when the
 * device is physically disconnected.
 */
const UnplugDeviceModal = ({
    onCancel,
    onDisconnect,
}: {
    onCancel: () => void;
    onDisconnect: (deviceId: string) => void;
}) => {
    useEffect(() => {
        const handleDeviceEvent = (event: DeviceEventMessage) => {
            if (event.type === DEVICE.DISCONNECT) {
                if (event.payload.id) {
                    onDisconnect(event.payload.id);
                }
                onCancel();
            }
        };

        TrezorConnect.on(DEVICE_EVENT, handleDeviceEvent);

        return () => {
            TrezorConnect.off(DEVICE_EVENT, handleDeviceEvent);
        };
    }, [onCancel, onDisconnect]);

    return (
        <Modal width={400} height={420}>
            <Column gap={24} alignItems="center">
                <DisconnectTrezorSvg />
                <Column gap={8} alignItems="center">
                    <Paragraph typographyStyle="headline-md" align="center">
                        <Translation id="TR_FORGET_DEVICE_MODAL_FINISH_FORGETTING_HEADING" />
                    </Paragraph>
                    <Paragraph align="center" typographyStyle="body-md" color="textSubdued">
                        <Translation id="TR_FORGET_DEVICE_MODAL_DISCONNECT_SUBTITLE" />
                    </Paragraph>
                </Column>
            </Column>
        </Modal>
    );
};

const RemoveFromBluetoothSettingsModal = ({
    onCancel,
    onGotIt,
}: {
    onCancel: () => void;
    onGotIt: () => void;
}) => {
    const dispatch = useDispatch();

    const handleOpenBluetoothSettings = () => {
        dispatch(openSystemSettingsThunk({ type: 'bluetooth' }));
    };

    return (
        <Modal
            onCancel={onCancel}
            heading={<Translation id="TR_FORGET_DEVICE_MODAL_FINISH_HEADING" />}
            width={600}
            bottomContent={
                <>
                    <Modal.Button onClick={handleOpenBluetoothSettings}>
                        <Translation id="TR_BLUETOOTH_OPEN_BLUETOOTH_SETTINGS" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onGotIt}>
                        <Translation id="TR_GOT_IT" />
                    </Modal.Button>
                </>
            }
        >
            <Paragraph>
                <Translation id="TR_BLUETOOTH_REMOVE_FROM_BLUETOOTH_SETTINGS_DESCRIPTION" />
            </Paragraph>
        </Modal>
    );
};

// --- Flow components (one per device state group) ---

/**
 * Non-THP disconnected devices and THP devices with no BT history.
 * Confirmation → forget immediately.
 */
const ImmediateForgetFlow = ({ onCancel }: ForgetFlowProps) => {
    const { dispatch, forgetDevice } = useForgetDevice();

    return (
        <ConfirmationModal
            onConfirm={() => {
                forgetDevice({
                    toastType: null,
                });
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
 * The device reference is captured in a ref while still connected so
 * `forgetDeviceThunk` can use it after disconnect (when `selectSelectedDevice`
 * would return null).
 */
const ConnectedCableForgetFlow = ({
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
const ThpBtConnectedForgetFlow = ({ onCancel }: ForgetFlowProps) => {
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
const ThpCableConnectedForgetFlow = ({ onCancel }: ForgetFlowProps) => {
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
const ThpBtKnownForgetFlow = ({ onCancel }: ForgetFlowProps) => {
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

// --- Main modal: resolves state → delegates to flow component ---

type ForgetModalProps = {
    onCancel: () => void;
};

export const ForgetDeviceModal = ({ onCancel }: ForgetModalProps) => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const persistentData = useSelector(state =>
        selectPersistentDeviceDataById(state, selectedDevice?.id),
    );

    const knownBluetoothDevice = useSelector(state =>
        selectKnownDeviceByDeviceId(state, selectedDevice?.id ?? undefined),
    );
    const hasBluetoothCredentials =
        persistentData?.lastConnectedVia === 'bluetooth' || !!knownBluetoothDevice;

    // Capture the device state once on mount so that mid-flow device changes
    // (e.g. BT disconnect after bleUnpair) don't swap out the flow component.
    const initialDeviceStateRef = useRef<ForgetDeviceState | null>(null);

    if (!selectedDevice) {
        return null;
    }

    if (initialDeviceStateRef.current === null) {
        initialDeviceStateRef.current = resolveForgetDeviceState(selectedDevice, {
            hasBluetoothCredentials,
        });
    }

    const deviceState = initialDeviceStateRef.current;

    switch (deviceState) {
        case 'non-thp-connected':
            return <ConnectedCableForgetFlow onCancel={onCancel} isBluetoothDevice={false} />;

        case 'non-thp-disconnected':
        case 'thp-disconnected':
            return <ImmediateForgetFlow onCancel={onCancel} />;

        case 'thp-bt-connected':
            return <ThpBtConnectedForgetFlow onCancel={onCancel} />;

        case 'thp-cable-connected':
            return <ThpCableConnectedForgetFlow onCancel={onCancel} />;

        case 'thp-bt-known':
            return <ThpBtKnownForgetFlow onCancel={onCancel} />;

        default:
            return exhaustive(deviceState);
    }
};

// --- Settings entry point ---

export const ForgetDevice = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const selectedDevice = useSelector(selectSelectedDevice);
    const hasRunningDiscovery = useSelector(selectHasRunningDiscovery);

    if (!selectedDevice || !deviceUtils.isDeviceAcquired(selectedDevice)) {
        return null;
    }

    const handleClick = () => setIsModalOpen(true);
    const handleModalCancel = () => setIsModalOpen(false);

    return (
        <>
            {isModalOpen && <ForgetDeviceModal onCancel={handleModalCancel} />}
            <SectionItem data-test="@settings/device/forget">
                <TextColumn
                    title={<Translation id="TR_FORGET_DEVICE_HEADING" />}
                    description={<Translation id="TR_FORGET_DEVICE_DESCRIPTION" />}
                />
                <ActionColumn>
                    <ActionButton
                        onClick={handleClick}
                        intent="warning"
                        isDisabled={hasRunningDiscovery}
                    >
                        <Translation id="TR_FORGET" />
                    </ActionButton>
                </ActionColumn>
            </SectionItem>
        </>
    );
};
