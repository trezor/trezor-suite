import { useMemo } from 'react';

import { selectDebugTransports, suiteSettingsActions } from '@suite/settings';
import { Checkbox } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { isDesktop } from '@trezor/env-utils';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectActiveTransports } from 'src/selectors/suite/suiteSelectors';

type TransportMenuItem = {
    id: string;
    description: string;
    active?: boolean;
    checked: boolean;
};

/**
 * Available transport ids per platform. These mirror the registry ids
 * defined in:
 *   - web: packages/suite/src/support/extraDependencies.ts
 *   - desktop main: packages/suite-desktop-core/src/modules/trezor-connect.ts
 *
 * If a new transport is added on either side, list it here as well so the
 * debug UI exposes a toggle.
 */
const TRANSPORTS_WEB = ['BridgeTransport', 'WebUsbTransport'] as const;
const TRANSPORTS_DESKTOP = ['BridgeTransport', 'NodeUsbTransport', 'UdpTransport'] as const;
const TRANSPORT_DESCRIPTIONS: Record<string, string> = {
    BridgeTransport:
        'Client for bridge http interface regardless node-bridge or trezord-go implementation. It expects bridge to run on http://127.0.0.1:21328/ or http://127.0.0.1:21325/.\
        This is the most general transport that may be used for both desktop and web version of Trezor Suite.',
    WebUsbTransport: 'Similar to NodeUsbTransport but using WebUSB API. Supported only in Chrome.',
    NodeUsbTransport: 'Direct access to usb using node.js implementation.',
    UdpTransport: 'Direct communication with emulators over udp.',
};

const useTransportItems = (transports: readonly string[]): TransportMenuItem[] => {
    const activeTransports = useSelector(selectActiveTransports);
    const debugTransports = useSelector(selectDebugTransports);

    return useMemo(
        () =>
            transports.map(id => ({
                id,
                description: TRANSPORT_DESCRIPTIONS[id] ?? '',
                active: activeTransports.some(a => a.type === id),
                checked: debugTransports?.includes(id) ?? false,
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
            {items.map(transport => (
                <SectionItem
                    key={transport.id}
                    data-testid={`@settings/debug/transport/${transport.id}`}
                >
                    <TextColumn
                        title={`${transport.id}${transport.active ? ' (Active)' : ''}`}
                        description={transport.description}
                    />
                    <ActionColumn>
                        <Checkbox
                            isChecked={transport.checked}
                            onChange={() => {
                                const nextTransportIds = items
                                    .filter(t => (t.id === transport.id) !== t.checked)
                                    .map(t => t.id);
                                dispatch(
                                    suiteSettingsActions.setDebugMode({
                                        transports: nextTransportIds,
                                    }),
                                );
                                TrezorConnect.updateConnectSettings({
                                    transportIds: nextTransportIds,
                                });
                            }}
                        />
                    </ActionColumn>
                </SectionItem>
            ))}
        </>
    );
};
