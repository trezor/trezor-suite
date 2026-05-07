import { useState } from 'react';

import { SettingsAnchor, goto } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { Column, H2, Modal, Paragraph } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { createConnect } from '@trezor/connect-flow';
import { ConfirmOnDevicePill } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { DeviceConfirmImage } from 'src/components/suite/DeviceConfirmImage';
import { PinMatrix } from 'src/components/suite/PinMatrix/PinMatrix';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { ConfirmAddressModal } from './ReduxModal/ConfirmAddressModal';
import { NoBackupModalView } from './ReduxModal/DeviceConfirmationModal/NoBackupModalView';
import { ConfirmActionModal } from './ReduxModal/DeviceContextModal/ConfirmActionModal';
import { PassphraseOnDeviceModal } from './ReduxModal/DeviceContextModal/PassphraseOnDeviceModal';

// Type-only helper. The body is never executed — used solely to derive the
// UI-subprocess union shape. UI subprocesses are structurally identical across
// all wrapped methods, so we re-use `getAddress` for the derivation; the
// method-specific `complete`/`error` variants are widened to `unknown` below
// so callers can pass any wrapped method's subprocess.
const _connect = createConnect({ trezorConnect: TrezorConnect });
const _typeHelper = () => _connect(TrezorConnect.getAddress);
type _AllSubprocesses =
    ReturnType<ReturnType<ReturnType<typeof _typeHelper>>['run']> extends AsyncIterable<infer T>
        ? T
        : never;
type _UiSubprocess = Exclude<_AllSubprocesses, { type: 'complete' } | { type: 'error' }>;
export type Subprocess =
    | _UiSubprocess
    | { type: 'complete'; result: unknown; cancel: () => void; callId: string; requestId?: string }
    | { type: 'error'; error: Error; cancel: () => void; callId: string; requestId?: string };

const PinSubprocessModal = ({
    subprocess,
}: {
    subprocess: Extract<Subprocess, { type: 'ui-request_pin' }>;
}) => {
    const device = useSelector(selectSelectedDevice);
    const [pin, setPin] = useState('');
    const handleSubmit = () => {
        subprocess.send(pin);
        setPin('');
    };

    return (
        <Modal.Backdrop>
            <ConfirmOnDevicePill
                title="Confirm on Trezor"
                deviceModelInternal={device?.features?.internal_model}
                deviceUnitColor={device?.features?.unit_color}
                onCancel={subprocess.cancel}
            />
            <Modal.ModalBase
                heading="Enter PIN"
                onCancel={subprocess.cancel}
                width={400}
                bottomContent={
                    <>
                        <Modal.Button onClick={handleSubmit} flex="1">
                            Confirm
                        </Modal.Button>
                        <Modal.Button
                            onClick={subprocess.cancel}
                            intent="neutral"
                            priority="secondary"
                            flex="1"
                        >
                            Cancel
                        </Modal.Button>
                    </>
                }
            >
                <PinMatrix pin={pin} setPin={setPin} onSubmit={handleSubmit} />
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
};

const PassphraseSubprocessModal = ({
    subprocess,
}: {
    subprocess: Extract<Subprocess, { type: 'ui-request_passphrase' }>;
}) => {
    const device = useSelector(selectSelectedDevice);
    const [passphrase, setPassphrase] = useState('');
    const handleSubmit = () => subprocess.send(passphrase);

    return (
        <Modal.Backdrop>
            <ConfirmOnDevicePill
                title="Confirm on Trezor"
                deviceModelInternal={device?.features?.internal_model}
                deviceUnitColor={device?.features?.unit_color}
                onCancel={subprocess.cancel}
            />
            <Modal.ModalBase
                heading="Enter passphrase"
                onCancel={subprocess.cancel}
                width={400}
                bottomContent={
                    <>
                        <Modal.Button onClick={handleSubmit} flex="1" isDisabled={!passphrase}>
                            Confirm
                        </Modal.Button>
                        <Modal.Button
                            onClick={subprocess.cancel}
                            intent="neutral"
                            priority="secondary"
                            flex="1"
                        >
                            Cancel
                        </Modal.Button>
                    </>
                }
            >
                <Column gap={spacings.md}>
                    <Paragraph>Enter the passphrase for your hidden wallet.</Paragraph>
                    <input
                        type="password"
                        value={passphrase}
                        onChange={e => setPassphrase(e.target.value)}
                        style={{
                            padding: 12,
                            fontSize: 16,
                            border: '1px solid #ccc',
                            borderRadius: 8,
                        }}
                    />
                </Column>
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
};

const ConfirmationSubprocessModal = ({
    subprocess,
}: {
    subprocess: Extract<Subprocess, { type: 'ui-request_confirmation' }>;
}) => {
    const device = useSelector(selectSelectedDevice);

    return (
        <Modal.Backdrop>
            <ConfirmOnDevicePill
                title="Confirm on Trezor"
                deviceModelInternal={device?.features?.internal_model}
                deviceUnitColor={device?.features?.unit_color}
                onCancel={() => subprocess.confirm(false)}
            />
            <Modal.ModalBase
                width={400}
                bottomContent={
                    <>
                        <Modal.Button onClick={() => subprocess.confirm(true)} flex="1">
                            Confirm
                        </Modal.Button>
                        <Modal.Button
                            onClick={() => subprocess.confirm(false)}
                            intent="neutral"
                            priority="secondary"
                            flex="1"
                        >
                            Cancel
                        </Modal.Button>
                    </>
                }
            >
                <Column alignItems="center" gap={spacings.md}>
                    {device && <DeviceConfirmImage device={device} />}
                    <H2 align="center">Confirm: {subprocess.payload.view}</H2>
                    {subprocess.payload.label && (
                        <Paragraph align="center">{subprocess.payload.label}</Paragraph>
                    )}
                </Column>
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
};

export const ConnectSubprocessModal = ({ subprocess }: { subprocess: Subprocess }) => {
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();
    if (!device) return null;

    switch (subprocess.type) {
        case 'ui-request_confirmation':
            if (subprocess.payload.view === 'no-backup') {
                return (
                    <NoBackupModalView
                        onConfirm={() => subprocess.confirm(true)}
                        onCancel={() => subprocess.confirm(false)}
                        onCreateBackup={() => {
                            subprocess.confirm(false);
                            dispatch(
                                goto({
                                    routeName: 'settings-device',
                                    anchor: SettingsAnchor.BackupRecoverySeed,
                                }),
                            );
                        }}
                    />
                );
            }

            return <ConfirmationSubprocessModal subprocess={subprocess} />;

        case 'ui-button':
            if (subprocess.payload.data?.type === 'address') {
                return (
                    <ConfirmAddressModal
                        addressPath={subprocess.payload.data.serializedPath}
                        value={subprocess.payload.data.address}
                        onCancel={subprocess.cancel}
                    />
                );
            }

            return <ConfirmActionModal device={device} onCancel={subprocess.cancel} />;

        case 'ui-request_passphrase_on_device':
            return <PassphraseOnDeviceModal device={device} />;

        case 'ui-request_pin':
            return <PinSubprocessModal subprocess={subprocess} />;

        case 'ui-request_passphrase':
            return <PassphraseSubprocessModal subprocess={subprocess} />;

        default:
            return null;
    }
};
