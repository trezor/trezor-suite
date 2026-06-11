import { useMemo, useRef, useState } from 'react';

import { closeModal } from '@suite/modal';
import { selectSelectedDevice } from '@suite-common/device';
import { Column, H2, Modal, Paragraph } from '@trezor/components';
import TrezorConnect, { UI_REQUEST } from '@trezor/connect';
import { createConnect } from '@trezor/connect-flow';
import {
    ActionButton,
    ActionColumn,
    ConfirmOnDevicePill,
    SectionItem,
    TextColumn,
} from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { DeviceConfirmImage } from 'src/components/suite/DeviceConfirmImage';
import { PinMatrix } from 'src/components/suite/PinMatrix/PinMatrix';
import { ConfirmAddressModal } from 'src/components/suite/modals/ReduxModal/ConfirmAddressModal';
import { ConfirmActionModal } from 'src/components/suite/modals/ReduxModal/DeviceContextModal/ConfirmActionModal';
import { PassphraseOnDeviceModal } from 'src/components/suite/modals/ReduxModal/DeviceContextModal/PassphraseOnDeviceModal';
import { useDispatch, useSelector } from 'src/hooks/suite';

const connect = createConnect({ trezorConnect: TrezorConnect });

// Type-only helper. The body is never executed — `_typeHelper` is only used
// to derive the wrapped getAddress signature without invoking
// `TrezorConnect.getAddress` at module load. In suite-desktop the renderer's
// `TrezorConnect` methods are still the dummy stubs from index.renderer.ts at
// import time; the IPC-proxy override only happens later in MainDesktop.tsx
// (see `Object.keys(TrezorConnect).forEach(...)`), so capturing the method
// at module level locks in the stub. Deferring the runtime call into a
// useMemo inside the component picks up the real proxy method.
const _typeHelper = () => connect(TrezorConnect.getAddress);
type WrappedGetAddress = ReturnType<typeof _typeHelper>;
type GetAddressProcess = ReturnType<WrappedGetAddress>;
type Subprocess = ReturnType<GetAddressProcess['run']> extends AsyncIterable<infer T> ? T : never;
type AddressResult = Awaited<ReturnType<GetAddressProcess['toPromise']>>;

type LogEntry = { type: Subprocess['type']; detail?: string };

const DEFAULT_PATH = "m/44'/0'/0'/0/0";

const formatDetail = (sub: Subprocess): string | undefined => {
    switch (sub.type) {
        case 'ui-button':
            return `code=${sub.payload.code}`;
        case 'ui-request_confirmation':
            return `view=${sub.payload.view}${sub.payload.label ? ` label=${sub.payload.label}` : ''}`;
        case 'ui-request_pin':
        case 'ui-request_passphrase':
        case 'ui-request_passphrase_on_device':
            return undefined;
        default:
            // UiNotificationSubProcess is an open union of all UI events — only
            // the interactive/terminal ones are formatted here.
            return undefined;
    }
};

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

const SubprocessModal = ({ subprocess }: { subprocess: Subprocess }) => {
    const device = useSelector(selectSelectedDevice);
    if (!device) return null;

    switch (subprocess.type) {
        case 'ui-request_confirmation':
            // 'no-backup' is rendered by suite's global ModalSwitcher — the
            // for-await loop dispatches into redux for that one.
            if (subprocess.payload.view === 'no-backup') return null;

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
            // UiNotificationSubProcess is an open union of all UI events — only
            // the interactive/terminal ones get a dedicated modal.
            return null;
    }
};

export const ConnectWrapPlayground = () => {
    const device = useSelector(selectSelectedDevice);
    const devicePath = device?.path;
    const dispatch = useDispatch();

    const [log, setLog] = useState<LogEntry[]>([]);
    const [running, setRunning] = useState(false);
    const [callId, setCallId] = useState<string | null>(null);
    const [subprocess, setSubprocess] = useState<Subprocess | null>(null);
    const [result, setResult] = useState<AddressResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const procRef = useRef<GetAddressProcess | null>(null);

    // Capture the wrapped getAddress lazily on mount — see `_typeHelper`
    // comment above; capturing earlier would lock in the renderer stubs.
    const wrappedGetAddress: WrappedGetAddress = useMemo(
        () => connect(TrezorConnect.getAddress),
        [],
    );

    const handleStart = async () => {
        if (!devicePath) return;
        setLog([]);
        setResult(null);
        setError(null);
        setSubprocess(null);

        const proc = wrappedGetAddress({
            device: { path: devicePath },
            path: DEFAULT_PATH,
            coin: 'btc',
            showOnTrezor: true,
        });
        procRef.current = proc;
        setCallId(proc.id);
        setRunning(true);

        const resultP = proc.toPromise();
        try {
            for await (const sub of proc.run()) {
                setSubprocess(sub);
                setLog(prev => [...prev, { type: sub.type, detail: formatDetail(sub) }]);

                // Mirror confirmation events into suite's redux modal slice so the
                // global ModalSwitcher can render the real modal (e.g. NoBackupModal).
                if (sub.type === 'ui-request_confirmation') {
                    dispatch({
                        type: UI_REQUEST.REQUEST_CONFIRMATION,
                        payload: { view: sub.payload.view, label: sub.payload.label },
                        requestId: sub.requestId,
                    });
                } else {
                    dispatch(closeModal());
                }
            }
            setResult(await resultP);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            if (procRef.current === proc) {
                procRef.current = null;
                setRunning(false);
                setSubprocess(null);
                setCallId(null);
            }
        }
    };

    const handleCancel = () => {
        procRef.current?.cancel();
    };

    return (
        <SectionItem data-testid="@settings/debug/connect-wrap-playground">
            <TextColumn
                title="connect() wrapper playground"
                description={
                    <Column gap={4}>
                        <span>
                            Wraps <code>TrezorConnect.getAddress</code> via the new generic{' '}
                            <code>createConnect</code> API and renders the matching modal for each
                            subprocess.
                        </span>
                        <span>
                            device path: <code>{devicePath ?? '(none selected)'}</code>
                        </span>
                        {callId && (
                            <span>
                                callId: <code>{callId}</code>
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
                    <ActionButton intent="critical" onClick={handleCancel}>
                        Cancel
                    </ActionButton>
                ) : (
                    <ActionButton intent="brand" onClick={handleStart} isDisabled={!devicePath}>
                        Run getAddress (wrapped)
                    </ActionButton>
                )}
            </ActionColumn>
            {subprocess && <SubprocessModal subprocess={subprocess} />}
        </SectionItem>
    );
};
