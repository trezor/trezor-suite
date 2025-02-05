import { useMemo } from 'react';

import { Checkbox } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { isDesktop } from '@trezor/env-utils';
import { ArrayElement } from '@trezor/type-utils';

import { setDebugMode } from 'src/actions/suite/suiteActions';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { DebugModeOptions, selectActiveTransports } from 'src/reducers/suite/suiteReducer';

type Transport = ArrayElement<NonNullable<DebugModeOptions['transports']>>;

type TransportMenuItem = {
    name: Transport;
    description: string;
    active?: boolean;
    checked: boolean;
};

const TRANSPORTS_WEB = ['BridgeTransport', 'WebUsbTransport'] as const;
const TRANSPORTS_DESKTOP = ['BridgeTransport', 'NodeUsbTransport', 'UdpTransport'] as const;
const TRANSPORT_DESCRIPTIONS: Record<Transport, string> = {
    BridgeTransport:
        'Client for bridge http interface regardless node-bridge or trezord-go implementation. It expects bridge to run on http://127.0.0.1:21325/.\
        This is the most general transport that may be used for both desktop and web version of Trezor Suite.',
    WebUsbTransport: 'Similar to NodeUsbTransport but using WebUSB API. Supported only in Chrome.',
    NodeUsbTransport: 'Direct access to usb using node.js implementation.',
    UdpTransport: 'Direct communication with emulators over udp.',
};

const useTransportItems = (transports: readonly Transport[]): TransportMenuItem[] => {
    const activeTransports = useSelector(selectActiveTransports);
    const debugTransports = useSelector(state => state.suite.settings.debug.transports);

    return useMemo(
        () =>
            transports.map(type => ({
                name: type,
                description: TRANSPORT_DESCRIPTIONS[type],
                active: activeTransports.some(a => a.type === type),
                checked: debugTransports?.includes(type),
            })),
        [transports, activeTransports, debugTransports],
    );
};

export const Transport = () => {
    const dispatch = useDispatch();
    const transports = isDesktop() ? TRANSPORTS_DESKTOP : TRANSPORTS_WEB;
    const items = useTransportItems(transports);

    return (
        <>
            <SectionItem data-testid="@settings/debug/transport">
                <TextColumn
                    title="Transport clients"
                    description="You may override TrezorConnect default settings here. Select your preferred transport clients that are to be used. You will need to reload after changes"
                />
            </SectionItem>
            {/* todo: make it drag and drop sortable */}
            {items.map(transport => (
                <SectionItem
                    key={transport.name}
                    data-testid={`@settings/debug/transport/${transport.name}`}
                >
                    <TextColumn
                        title={`${transport.name}${transport.active ? ' (Active)' : ''}`}
                        description={transport.description}
                    />
                    <ActionColumn>
                        <Checkbox
                            isChecked={transport.checked}
                            onClick={() => {
                                const nextTransports = items
                                    .filter(t => (t.name === transport.name) !== t.checked)
                                    .map(t => t.name);
                                dispatch(setDebugMode({ transports: nextTransports }));
                                TrezorConnect.setTransports({ transports: nextTransports });
                            }}
                        />
                    </ActionColumn>
                </SectionItem>
            ))}
        </>
    );
};
