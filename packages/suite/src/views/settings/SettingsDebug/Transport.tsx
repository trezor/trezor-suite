import { useMemo } from 'react';

import { Checkbox } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { isDesktop } from '@trezor/env-utils';
import type { ApiType } from '@trezor/transport';

import { setDebugMode } from 'src/actions/suite/suiteActions';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectActiveTransports } from 'src/selectors/suite/suiteSelectors';

type Transport = 'usb' | 'udp' | 'bluetooth';

type TransportMenuItem = {
    name: Transport;
    label: string;
    description: string;
    active?: boolean;
    checked: boolean;
};

const TRANSPORTS_WEB: Transport[] = ['usb'];
const TRANSPORTS_DESKTOP: Transport[] = ['usb', 'udp'];
const TRANSPORT_INFO: Record<Transport, { label: string; description: string }> = {
    usb: {
        label: 'USB',
        description:
            'USB transport for connecting to Trezor devices. Uses WebUSB in browsers or native USB in desktop apps. Can connect through Trezor Bridge (http://127.0.0.1:21328/ or https://localhost:21325/) or directly.',
    },
    udp: {
        label: 'UDP (Emulator)',
        description: 'Direct communication with emulators over UDP protocol.',
    },
    bluetooth: {
        label: 'Bluetooth',
        description: 'Wireless connection to Trezor devices via Bluetooth.',
    },
};

const useTransportItems = (transports: readonly Transport[]): TransportMenuItem[] => {
    const activeTransports = useSelector(selectActiveTransports);
    const debugTransports = useSelector(state => state.suite.settings.debug.apiTypes);

    return useMemo(
        () =>
            transports.map(type => ({
                name: type,
                label: TRANSPORT_INFO[type].label,
                description: TRANSPORT_INFO[type].description,
                // UnifiedTransport handles all transport types, so mark as active if any transport is active
                active: activeTransports.length > 0,
                checked: debugTransports?.includes(type) ?? false,
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
                    title="Transport apis"
                    description="You may override TrezorConnect default settings here. Select your preferred transport apis that are to be used. You will need to reload after changes"
                />
            </SectionItem>
            {/* todo: make it drag and drop sortable */}
            {items.map(transport => (
                <SectionItem
                    key={transport.name}
                    data-testid={`@settings/debug/transport/${transport.name}`}
                >
                    <TextColumn
                        title={`${transport.label}${transport.active ? ' (Active)' : ''}`}
                        description={transport.description}
                    />
                    <ActionColumn>
                        <Checkbox
                            isChecked={transport.checked}
                            onClick={() => {
                                const nextTransports = items
                                    .filter(t => (t.name === transport.name) !== t.checked)
                                    .map(t => t.name);
                                dispatch(setDebugMode({ apiTypes: nextTransports }));
                                // Use the selected apiTypes directly (they're already ApiType values)
                                const apiTypes: ApiType[] = nextTransports;
                                TrezorConnect.setTransports({ apiTypes });
                            }}
                        />
                    </ActionColumn>
                </SectionItem>
            ))}
        </>
    );
};
