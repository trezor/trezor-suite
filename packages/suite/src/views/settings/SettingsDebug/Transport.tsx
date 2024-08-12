import { useMemo } from 'react';

import { Checkbox } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { ArrayElement } from '@trezor/type-utils';

import { setDebugMode } from 'src/actions/suite/suiteActions';
import { DebugModeOptions } from 'src/reducers/suite/suiteReducer';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';

type TransportMenuItem = {
    name: ArrayElement<NonNullable<DebugModeOptions['transports']>>;
    // todo: this is not true, at the moment it means something like "registered by connect"
    // @trezor/connect is actively using this transport
    active?: boolean;
};

export const Transport = () => {
    const debug = useSelector(state => state.suite.settings.debug);
    const transport = useSelector(state => state.suite.transport);
    const dispatch = useDispatch();

    // fallback [] to avoid need of migration.
    const debugTransports = useMemo(() => debug.transports || [], [debug.transports]);

    const transports: TransportMenuItem[] = useMemo(() => {
        const transports: TransportMenuItem['name'][] = ['BridgeTransport'];

        if (isDesktop()) {
            transports.push('NodeUsbTransport');
            transports.push('UdpTransport');
        } else {
            transports.push('WebUsbTransport');
        }

        return transports.map(t => ({
            active: t === transport?.type,
            name: t,
        }));
    }, [transport]);

    return (
        <>
            <SectionItem data-testid="@settings/debug/transport">
                <TextColumn
                    title="Transport clients"
                    description="You may override TrezorConnect default settings here. Select your preferred transport clients that are to be used. You will need to reload after changes"
                />
            </SectionItem>
            {/* todo: make it drag and drop sortable */}
            {transports.map(transport => (
                <SectionItem
                    data-testid={`@settings/debug/transport/${transport.name}`}
                    key={transport.name}
                >
                    <TextColumn
                        title={`${transport.name} ${transport.active ? '(Active)' : ''}`}
                        description={(() => {
                            switch (transport.name) {
                                case 'BridgeTransport':
                                    return 'Client for bridge http interface regardless node-bridge or trezord-go implementation. It expects bridge to run on http://127.0.0.1:21325/. This is the most general transport that may be used for both desktop and web version of Trezor Suite.';
                                case 'NodeUsbTransport':
                                    return 'Direct access to usb using node.js implementation.';
                                case 'UdpTransport':
                                    return 'Direct communication with emulators over udp.';
                                case 'WebUsbTransport':
                                    return 'Similar to NodeUsbTransport but using WebUSB API. Supported only in Chrome.';
                                default:
                                    return '';
                            }
                        })()}
                    />
                    <ActionColumn>
                        <Checkbox
                            isChecked={debugTransports.includes(transport.name)}
                            onClick={() => {
                                const nextTransports = debugTransports.includes(transport.name)
                                    ? debugTransports.filter(t => t !== transport.name)
                                    : [...debugTransports, transport.name];

                                dispatch(setDebugMode({ transports: nextTransports }));
                            }}
                        />
                    </ActionColumn>
                </SectionItem>
            ))}
        </>
    );
};
