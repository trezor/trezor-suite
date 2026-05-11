import { useState } from 'react';

import { selectSelectedDevice } from '@suite-common/device';
import { Column } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { createConnect } from '@trezor/connect-flow';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { ConnectSubprocessModal } from 'src/components/suite/modals/ConnectSubprocessModal';
import { useSelector } from 'src/hooks/suite';

import { useConnectRun } from './useConnect';

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

const DEFAULT_PATH = "m/44'/0'/0'/0/0";

const formatDetail = (sub: Subprocess): string | undefined => {
    switch (sub.type) {
        case 'ui-button':
            return `code=${sub.payload.code}`;
        case 'ui-request_confirmation':
            return `view=${sub.payload.view}${sub.payload.label ? ` label=${sub.payload.label}` : ''}`;
        case 'complete':
            return JSON.stringify(sub.result);
        case 'error':
            return sub.error.message;
        case 'ui-request_pin':
        case 'ui-request_passphrase':
        case 'ui-request_passphrase_on_device':
            return undefined;
        default:
            return undefined;
    }
};

// Wrap TrezorConnect.getAddress through a lambda so the property is read at
// invocation time, not at module-load time. In suite-desktop the renderer's
// `TrezorConnect` methods are still the dummy stubs from index.renderer.ts at
// import time; the IPC-proxy override only happens later in MainDesktop.tsx
// (`Object.keys(TrezorConnect).forEach(...)`). Capturing the method directly
// would lock in the stub.
const lazyGetAddress: typeof TrezorConnect.getAddress = ((args: any) =>
    TrezorConnect.getAddress(args)) as typeof TrezorConnect.getAddress;
const wrappedGetAddress: WrappedGetAddress = connect(lazyGetAddress);

export const ConnectWrapPlayground = () => {
    const device = useSelector(selectSelectedDevice);
    const devicePath = device?.path;

    const { start, cancel, subprocess, running, loading } = useConnectRun(wrappedGetAddress);
    const [callId, setCallId] = useState<string | null>(null);
    const [result, setResult] = useState<{ address: string } | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const handleStart = async () => {
        if (!devicePath) return;
        setResult(null);
        setError(null);

        const proc = start({
            device: { path: devicePath },
            path: DEFAULT_PATH,
            coin: 'btc',
            showOnTrezor: true,
        });
        setCallId(proc.id);

        try {
            const value = await proc.toPromise();
            setResult(value);
        } catch (e) {
            setError(e instanceof Error ? e : new Error(String(e)));
        } finally {
            setCallId(null);
        }
    };

    const detail = subprocess ? formatDetail(subprocess) : undefined;

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
                                ✗ error: <code>{error.message}</code>
                            </span>
                        )}
                        {subprocess && (
                            <span>
                                current: <code>{subprocess.type}</code>
                                {detail ? ` — ${detail}` : ''}
                            </span>
                        )}
                        {loading && <span>loading…</span>}
                    </Column>
                }
            />
            <ActionColumn>
                {running ? (
                    <ActionButton intent="critical" onClick={cancel}>
                        Cancel
                    </ActionButton>
                ) : (
                    <ActionButton intent="brand" onClick={handleStart} isDisabled={!devicePath}>
                        Run getAddress (wrapped)
                    </ActionButton>
                )}
            </ActionColumn>
            {[subprocess].map(truthySubprocess => {
                if (!truthySubprocess) {
                    return null;
                }

                switch (truthySubprocess.type) {
                    default:
                        return <ConnectSubprocessModal subprocess={truthySubprocess} />;
                }
            })}
        </SectionItem>
    );
};
