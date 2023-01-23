import React, { useEffect, useState, useMemo } from 'react';

import { Checkbox } from '@trezor/components';
import { isDesktop } from '@suite-utils/env';
import { useSelector, useActions } from '@suite-hooks';
import * as suiteActions from '@suite-actions/suiteActions';
import { DebugModeOptions } from '@suite/reducers/suite/suiteReducer';
import { ArrayElement } from '@trezor/type-utils';
import TrezorConnect, { ConnectSettings } from '@trezor/connect';

import { ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';

type TransportMenuItem = {
    name: ArrayElement<NonNullable<DebugModeOptions['transports']>>;
    // user has marked this transport as requested, @trezor/connect should try to use it
    requested?: boolean;
    // @trezor/connect is actively using this transport
    active?: boolean;
};

export const Transport = () => {
    const [connectSettings, setConnectSettings] = useState<ConnectSettings>();

    useEffect(() => {
        TrezorConnect.getSettings().then(result => {
            if (!result.success) return;
            setConnectSettings(result.payload);
        });
    }, []);

    const { debug } = useSelector(state => ({
        debug: state.suite.settings.debug,
    }));

    // fallback [] to avoid need of migration.
    const debugTransports = useMemo(() => debug.transports || [], [debug.transports]);

    const transports: TransportMenuItem[] = useMemo(() => {
        const transports: TransportMenuItem['name'][] = ['BridgeTransport'];

        if (isDesktop()) {
            // todo: enable after nodeusb is merged
            // transports.push('NodeUsbTransport');
        } else {
            transports.push('WebUsbTransport');
        }

        return transports.map(transport => ({
            requested: debugTransports.includes(transport),
            active: connectSettings?.transports?.includes(transport),
            name: transport,
        }));
    }, [connectSettings, debugTransports]);

    const { setDebugMode } = useActions({
        setDebugMode: suiteActions.setDebugMode,
    });

    return (
        <>
            <SectionItem data-test="@settings/debug/transport">
                <TextColumn
                    title="Transports"
                    description="You may override TrezorConnect default settings here. Select preferred transports that are to be used. You will need to reload after changes"
                />
            </SectionItem>
            {/* todo: make it drag and drop sortable */}
            {transports.map(transport => (
                <SectionItem
                    data-test={`@settings/debug/transport/${transport.name}`}
                    key={transport.name}
                >
                    <TextColumn title={`${transport.name} ${transport.active ? '(Active)' : ''}`} />
                    <ActionColumn>
                        <Checkbox
                            isChecked={transport.requested}
                            onClick={() => {
                                const nextTransports = debugTransports.includes(transport.name)
                                    ? debugTransports.filter(t => t !== transport.name)
                                    : [...debugTransports, transport.name];

                                setDebugMode({
                                    transports: nextTransports,
                                });
                            }}
                        />
                    </ActionColumn>
                </SectionItem>
            ))}
        </>
    );
};
