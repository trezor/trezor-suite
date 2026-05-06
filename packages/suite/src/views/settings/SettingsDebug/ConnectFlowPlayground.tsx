import { useEffect, useState } from 'react';

import { selectSelectedDevice } from '@suite-common/device';
import { Column, H2, Modal, Paragraph } from '@trezor/components';
import {
    type AddressResult,
    type GetAddressSubProcess,
    SUBPROCESS_TYPE,
    UI_REQUEST,
} from '@trezor/connect-flow';
import {
    ActionButton,
    ActionColumn,
    ConfirmOnDevicePill,
    SectionItem,
    TextColumn,
} from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { DeviceConfirmImage } from 'src/components/suite/DeviceConfirmImage';
import { ConfirmAddressModal } from 'src/components/suite/modals/ReduxModal/ConfirmAddressModal';
import { NoBackupModalView } from 'src/components/suite/modals/ReduxModal/DeviceConfirmationModal/NoBackupModalView';
import { ConfirmActionModalView } from 'src/components/suite/modals/ReduxModal/DeviceContextModal/ConfirmActionModalView';
import { PassphraseOnDeviceModalView } from 'src/components/suite/modals/ReduxModal/DeviceContextModal/PassphraseOnDeviceModalView';
import { PinModalView } from 'src/components/suite/modals/ReduxModal/DeviceContextModal/PinModalView';
import { useSelector } from 'src/hooks/suite';

import { CONNECT_METHOD, useConnectService } from './useConnectService';

type LogEntry = {
    callId: string;
    type: GetAddressSubProcess['type'];
    detail?: string;
};

const DEFAULT_PATH = "m/44'/0'/0'/0/0";

const formatSubprocessDetail = (subprocess: GetAddressSubProcess): string | undefined => {
    switch (subprocess.type) {
        case UI_REQUEST.REQUEST_BUTTON:
            return `code=${subprocess.payload.code}`;
        case SUBPROCESS_TYPE.REQUEST_CONFIRMATION:
            return `view=${subprocess.view}${subprocess.label ? ` label=${subprocess.label}` : ''}`;
        case SUBPROCESS_TYPE.COMPLETE:
            return JSON.stringify(subprocess.result);
        case SUBPROCESS_TYPE.ERROR:
            return subprocess.error.message;
        default:
            return undefined;
    }
};

type PinSubprocess = Extract<GetAddressSubProcess, { type: 'ui-request_pin' }>;

// Mirrors the redux PinModal lifecycle: this component is mounted for the
// duration of the PIN flow (first REQUEST_PIN through COMPLETE / ERROR /
// cancel), not per-subprocess. INVALID_PIN flips `hasInvalidPin` upstream
// without remounting, and subsequent REQUEST_PIN events update `subprocess`
// in place — so the user's PIN entry stays fluid and the modal never blinks.
//
// The `submitted` flag mirrors `usePin` from suite-common/device: latched on
// submit (disables buttons so the user can't double-send), released whenever
// the device responds — either with a fresh REQUEST_PIN (`subprocess.requestId`
// changes) or with INVALID_PIN (`hasInvalidPin` flips), the same two triggers
// that bump `buttonRequests.length` in the redux flow.
const PinFlowModal = ({
    subprocess,
    hasInvalidPin,
}: {
    subprocess: PinSubprocess;
    hasInvalidPin: boolean;
}) => {
    const device = useSelector(selectSelectedDevice);
    const [pin, setPin] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setSubmitted(false);
    }, [subprocess.requestId, hasInvalidPin]);

    if (!device) return null;
    const handleSubmit = () => {
        if (submitted) return;
        setSubmitted(true);
        subprocess.send(pin);
        setPin('');
    };

    return (
        <PinModalView
            device={device}
            pin={pin}
            setPin={setPin}
            onSubmit={handleSubmit}
            onCancel={subprocess.cancel}
            showExplanation={hasInvalidPin}
            submitted={submitted}
        />
    );
};

const PassphraseSubprocessModal = ({
    subprocess,
}: {
    subprocess: Extract<GetAddressSubProcess, { type: 'ui-request_passphrase' }>;
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
    subprocess: Extract<GetAddressSubProcess, { type: 'ui-request_confirmation' }>;
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
                    <H2 align="center">Confirm: {subprocess.view}</H2>
                    {subprocess.label && <Paragraph align="center">{subprocess.label}</Paragraph>}
                </Column>
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
};

const SubprocessModal = ({ subprocess }: { subprocess: GetAddressSubProcess }) => {
    const device = useSelector(selectSelectedDevice);
    if (!device) return null;

    console.log('subprocess', subprocess);

    switch (subprocess.type) {
        case SUBPROCESS_TYPE.REQUEST_CONFIRMATION:
            if (subprocess.view === 'no-backup') {
                const decline = () => subprocess.confirm(false);

                return (
                    <NoBackupModalView
                        onConfirm={() => subprocess.confirm(true)}
                        onCancel={decline}
                        onCreateBackup={decline}
                    />
                );
            }

            return <ConfirmationSubprocessModal subprocess={subprocess} />;

        case UI_REQUEST.REQUEST_BUTTON:
            if (subprocess.payload.data?.type === 'address') {
                return (
                    <ConfirmAddressModal
                        addressPath={subprocess.payload.data.serializedPath}
                        value={subprocess.payload.data.address}
                        onCancel={subprocess.cancel}
                    />
                );
            }

            // T1B1 announces an upcoming PIN prompt with this event before
            // emitting REQUEST_PIN. There's nothing to confirm on a T1 (no
            // touchscreen, no on-device PIN pad), so showing "Confirm on
            // Trezor" is misleading — return null and let the next
            // REQUEST_PIN bring up PinFlowModal.
            if (subprocess.payload.code === 'ButtonRequest_PinEntry') {
                return null;
            }

            // T2T1 with legacy firmware uses this code for on-device
            // passphrase entry — same shape as REQUEST_PASSPHRASE_ON_DEVICE.
            if (subprocess.payload.code === 'ButtonRequest_PassphraseEntry') {
                return (
                    <PassphraseOnDeviceModalView
                        device={device}
                        deviceLabel={device.features?.label ?? undefined}
                        confirmEmptyPassphrase={false}
                        onCancel={subprocess.cancel}
                    />
                );
            }

            return <ConfirmActionModalView device={device} onCancel={subprocess.cancel} />;

        case UI_REQUEST.REQUEST_PASSPHRASE_ON_DEVICE:
            return (
                <PassphraseOnDeviceModalView
                    device={device}
                    deviceLabel={device.features?.label ?? undefined}
                    confirmEmptyPassphrase={false}
                    onCancel={subprocess.cancel}
                />
            );

        case SUBPROCESS_TYPE.REQUEST_PASSPHRASE:
            return <PassphraseSubprocessModal subprocess={subprocess} />;

        // REQUEST_PIN / INVALID_PIN are handled by the persistent
        // PinFlowModal at the top level — see ConnectFlowPlayground.
        case SUBPROCESS_TYPE.REQUEST_PIN:
        case UI_REQUEST.INVALID_PIN:
            return null;

        default:
            // Other notifications (firmware progress, bundle progress, etc.)
            // don't have a dedicated playground modal and are surfaced
            // through the log instead.
            return null;
    }
};

export const ConnectFlowPlayground = () => {
    const { process, subprocess, start, cancel, devicePath } = useConnectService(
        CONNECT_METHOD.GET_ADDRESS,
    );
    const [log, setLog] = useState<LogEntry[]>([]);
    const [result, setResult] = useState<AddressResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    // PIN flow is tracked separately so the PinFlowModal stays mounted
    // across REQUEST_PIN → INVALID_PIN → REQUEST_PIN — same lifecycle as
    // the redux PinModal, which is driven by `device.buttonRequests` rather
    // than by the current UI event.
    const [activePinSubprocess, setActivePinSubprocess] = useState<PinSubprocess | null>(null);
    const [hasInvalidPin, setHasInvalidPin] = useState(false);

    useEffect(() => {
        if (!subprocess) return;
        setLog(prev => [
            ...prev,
            {
                callId: subprocess.callId,
                type: subprocess.type,
                detail: formatSubprocessDetail(subprocess),
            },
        ]);
        if (subprocess.type === SUBPROCESS_TYPE.REQUEST_PIN) {
            setActivePinSubprocess(subprocess);
        } else if (subprocess.type === UI_REQUEST.INVALID_PIN) {
            setHasInvalidPin(true);
        } else if (subprocess.type === SUBPROCESS_TYPE.COMPLETE) {
            setResult(subprocess.result);
            setActivePinSubprocess(null);
        } else if (subprocess.type === SUBPROCESS_TYPE.ERROR) {
            setError(subprocess.error.message);
            setActivePinSubprocess(null);
        }
    }, [subprocess]);

    const handleStart = () => {
        setLog([]);
        setResult(null);
        setError(null);
        setHasInvalidPin(false);
        setActivePinSubprocess(null);
        try {
            start({
                path: DEFAULT_PATH,
                coin: 'btc',
                showOnTrezor: true,
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    };

    const running = process !== null;

    return (
        <SectionItem data-testid="@settings/debug/connect-flow-playground">
            <TextColumn
                title="connect-flow playground"
                description={
                    <Column gap={4}>
                        <span>
                            Drives <code>connectService.getAddress</code> against the connected
                            device and renders the matching modal for each subprocess.
                        </span>
                        <span>
                            device path: <code>{devicePath ?? '(none selected)'}</code>
                        </span>
                        {process && (
                            <span>
                                callId: <code>{process.callId}</code>
                            </span>
                        )}
                        {result && (
                            <span>
                                ✓ address: <code>{result.address}</code>
                            </span>
                        )}
                        {error && (
                            <span>
                                ✗ error: <code>{error}</code>
                            </span>
                        )}
                        {log.length > 0 && (
                            <ul style={{ marginTop: 8 }}>
                                {log.map((entry, i) => (
                                    <li key={i}>
                                        <code>{entry.type}</code>
                                        {entry.detail ? ` — ${entry.detail}` : ''}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Column>
                }
            />
            <ActionColumn>
                {running ? (
                    <ActionButton intent="critical" onClick={cancel}>
                        Cancel
                    </ActionButton>
                ) : (
                    <ActionButton intent="brand" onClick={handleStart}>
                        Run getAddress
                    </ActionButton>
                )}
            </ActionColumn>
            {activePinSubprocess && (
                <PinFlowModal subprocess={activePinSubprocess} hasInvalidPin={hasInvalidPin} />
            )}
            {subprocess && <SubprocessModal subprocess={subprocess} />}
        </SectionItem>
    );
};
