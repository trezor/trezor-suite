import { useEffect, useMemo, useRef, useState } from 'react';

import { selectSelectedDevice } from '@suite-common/device';
import { defaultTrezorUIEventHandlerThunk } from '@suite-common/wallet-core';
import { Column } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { createConnect, normalizeError } from '@trezor/connect-flow';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { HomescreenGallery, type HomescreenSettings } from 'src/components/suite/HomescreenGallery';
import { useDispatch, useSelector } from 'src/hooks/suite';

type LogEntry = { type: string; detail?: string };

export const ConnectFlowPlayground = () => {
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const devicePath = device?.path;

    const connect = useMemo(() => createConnect({ trezorConnect: TrezorConnect }), []);

    const [log, setLog] = useState<LogEntry[]>([]);
    const [running, setRunning] = useState(false);
    const cancelRef = useRef<(() => void) | null>(null);

    useEffect(() => () => cancelRef.current?.(), []);

    const changeBackground = async (settings: HomescreenSettings) => {
        setLog([]);
        setRunning(true);
        const proc = connect(TrezorConnect.applySettings)(settings);
        cancelRef.current = () => proc.cancel();
        try {
            for await (const sub of proc.run()) {
                setLog(prev => [...prev, { type: sub.type }]);
                dispatch(defaultTrezorUIEventHandlerThunk(sub.originalEvent));
            }
            setLog(prev => [...prev, { type: 'done' }]);
        } catch (e) {
            setLog(prev => [...prev, { type: 'error', detail: normalizeError(e).message }]);
        } finally {
            setRunning(false);
            cancelRef.current = null;
        }
    };

    const cancel = () => cancelRef.current?.();

    return (
        <Column gap={16}>
            <SectionItem data-testid="@settings/debug/connect-flow-playground">
                <TextColumn
                    title="connect-flow playground"
                    description={
                        <Column gap={4}>
                            <span>
                                Drives a connect-flow process against the device. Device UI (PIN,
                                passphrase, button confirmations) is handled by the normal redux
                                modals; this just logs the subprocess events. Pick an image below to
                                change the device background via the connect-flow API.
                            </span>
                            <span>
                                device path: <code>{devicePath ?? '(none selected)'}</code>
                            </span>
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
                {running && (
                    <ActionColumn>
                        <ActionButton intent="critical" onClick={cancel}>
                            Cancel
                        </ActionButton>
                    </ActionColumn>
                )}
            </SectionItem>
            {!running && <HomescreenGallery applyHomescreen={changeBackground} />}
        </Column>
    );
};
