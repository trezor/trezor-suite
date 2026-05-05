import { useEffect, useState } from 'react';

import { closeModal } from '@suite/modal';
import { selectSelectedDevice } from '@suite-common/device';
import { Column, H2, Modal, Paragraph } from '@trezor/components';
import { UI_REQUEST } from '@trezor/connect';
import {
    type AddressResult,
    type GetAddressSubProcess,
    SUBPROCESS_TYPE,
    type SubProcessType,
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
import { PinMatrix } from 'src/components/suite/PinMatrix/PinMatrix';
import { ConfirmAddressModal } from 'src/components/suite/modals/ReduxModal/ConfirmAddressModal';
import { ConfirmActionModal } from 'src/components/suite/modals/ReduxModal/DeviceContextModal/ConfirmActionModal';
import { PassphraseOnDeviceModal } from 'src/components/suite/modals/ReduxModal/DeviceContextModal/PassphraseOnDeviceModal';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { CONNECT_METHOD, useConnectService } from './useConnectService';

type LogEntry = {
    callId: string;
    type: SubProcessType;
    detail?: string;
};

const DEFAULT_PATH = "m/44'/0'/0'/0/0";

const formatSubprocessDetail = (subprocess: GetAddressSubProcess): string | undefined => {
    switch (subprocess.type) {
        case SUBPROCESS_TYPE.REQUEST_BUTTON:
            return `code=${subprocess.code}`;
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

const PinSubprocessModal = ({
    subprocess,
}: {
    subprocess: Extract<GetAddressSubProcess, { type: 'ui-request_pin' }>;
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

    switch (subprocess.type) {
        case SUBPROCESS_TYPE.REQUEST_CONFIRMATION:
            // 'no-backup' (and any view ModalSwitcher knows about) is rendered by
            // suite's global ModalSwitcher — see the redux-dispatch effect in
            // ConnectFlowPlayground that sets state.modal.context for us.
            if (subprocess.view === 'no-backup') return null;

            return <ConfirmationSubprocessModal subprocess={subprocess} />;

        case SUBPROCESS_TYPE.REQUEST_BUTTON:
            if (subprocess.data?.type === 'address') {
                return (
                    <ConfirmAddressModal
                        addressPath={subprocess.data.serializedPath}
                        value={subprocess.data.address}
                        onCancel={subprocess.cancel}
                    />
                );
            }

            return <ConfirmActionModal device={device} onCancel={subprocess.cancel} />;

        case SUBPROCESS_TYPE.REQUEST_PASSPHRASE_ON_DEVICE:
            return <PassphraseOnDeviceModal device={device} />;

        case SUBPROCESS_TYPE.REQUEST_PIN:
            return <PinSubprocessModal subprocess={subprocess} />;

        case SUBPROCESS_TYPE.REQUEST_PASSPHRASE:
            return <PassphraseSubprocessModal subprocess={subprocess} />;

        case SUBPROCESS_TYPE.COMPLETE:
        case SUBPROCESS_TYPE.ERROR:
            return null;

        default:
            return null;
    }
};

export const ConnectFlowPlayground = () => {
    const { process, subprocess, start, cancel, devicePath } = useConnectService(
        CONNECT_METHOD.GET_ADDRESS,
    );
    const dispatch = useDispatch();
    const [log, setLog] = useState<LogEntry[]>([]);
    const [result, setResult] = useState<AddressResult | null>(null);
    const [error, setError] = useState<string | null>(null);

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
        if (subprocess.type === SUBPROCESS_TYPE.COMPLETE) {
            setResult(subprocess.result);
        } else if (subprocess.type === SUBPROCESS_TYPE.ERROR) {
            setError(subprocess.error.message);
        }
    }, [subprocess]);

    const handleStart = () => {
        setLog([]);
        setResult(null);
        setError(null);
        try {
            start(
                {
                    path: DEFAULT_PATH,
                    coin: 'btc',
                    showOnTrezor: true,
                },
                // Mirror the UI event into suite's redux modal slice so the global
                // ModalSwitcher renders the real modal (e.g. NoBackupModal) and its
                // built-in onReceiveConfirmation finds the right requestId.
                // connectInitThunks bails on events with callId, so without this the
                // redux state would never get populated for our flow.
                next => {
                    if (next.type === SUBPROCESS_TYPE.REQUEST_CONFIRMATION) {
                        dispatch({
                            type: UI_REQUEST.REQUEST_CONFIRMATION,
                            payload: { view: next.view, label: next.label },
                            requestId: next.requestId,
                        });
                    } else {
                        dispatch(closeModal());
                    }
                },
            );
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
            {subprocess && <SubprocessModal subprocess={subprocess} />}
        </SectionItem>
    );
};
