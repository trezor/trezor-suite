import React, { useMemo } from 'react';

import { Checkbox } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { useSelector, useActions } from 'src/hooks/suite';
import * as suiteActions from 'src/actions/suite/suiteActions';
import { DebugModeOptions } from 'src/reducers/suite/suiteReducer';
import { ArrayElement } from '@trezor/type-utils';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite/Settings';

type TransportMenuItem = {
    name: ArrayElement<NonNullable<DebugModeOptions['transports']>>;
    // todo: this is not true, at the moment it means something like "registered by connect"
    // @trezor/connect is actively using this transport
    active?: boolean;
};

export const Transport = () => {
    const { debug, transport } = useSelector(state => ({
        debug: state.suite.settings.debug,
        transport: state.suite.transport,
    }));

    // fallback [] to avoid need of migration.
    const debugTransports = useMemo(() => debug.transports || [], [debug.transports]);

    const transports: TransportMenuItem[] = useMemo(() => {
        const transports: TransportMenuItem['name'][] = ['BridgeTransport'];

        if (isDesktop()) {
            transports.push('NodeUsbTransport');
        } else {
            transports.push('WebUsbTransport');
        }

        return transports.map(t => ({
            active: t === transport?.type,
            name: t,
        }));
    }, [transport]);

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
                            isChecked={debugTransports.includes(transport.name)}
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
