import React from 'react';
import { Checkbox } from '@trezor/components';
import { isDesktop } from '@suite-utils/env';
import { useSelector, useActions } from '@suite-hooks';
import * as suiteActions from '@suite-actions/suiteActions';
import { DebugModeOptions } from '@suite-common/suite-types';

import { ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';

type TransportMenuItem = {
    name: DebugModeOptions['transports'][number];
    env: ('desktop' | 'web')[];
    emulator: boolean; // emulator support
    device: boolean; // physical device support
};

export const Transport = () => {
    const transports: TransportMenuItem[] = [
        {
            name: 'BridgeTransport',
            env: ['desktop', 'web'],
            emulator: true,
            device: true,
        },
        {
            name: 'NodeUsbTransport',
            env: ['desktop'],
            emulator: false,
            device: true,
        },
        {
            name: 'WebUsbTransport',
            env: ['web'],
            emulator: false,
            device: true,
        },
        {
            // @ts-expect-error
            name: 'UdpTransport (not implemented)',
            env: [], // desktop but empty because not implemented yet
            emulator: true,
            device: false,
        },
    ];

    const env = isDesktop() ? 'desktop' : 'web';

    const { setDebugMode } = useActions({
        setDebugMode: suiteActions.setDebugMode,
    });
    const { debug, activeTransport } = useSelector(state => ({
        debug: state.suite.settings.debug,
        activeTransport: state.suite.transport,
    }));

    // fallback [] to avoid need of migration. todo: should we add migration?
    const debugTransports = debug.transports || [];

    return (
        <>
            <SectionItem data-test="@settings/debug/transport">
                <TextColumn
                    title="Transports"
                    description="You may override TrezorConnect default settings here. Select transports that are to be used. You will need to reload after changes"
                />
            </SectionItem>
            {transports.map(transport => {
                return (
                    <SectionItem
                        data-test={`@settings/debug/transport/${transport.name}`}
                        key={transport.name}
                    >
                        <TextColumn
                            title={`${transport.name} ${
                                activeTransport?.type === transport.name ? '(Active)' : ''
                            }`}
                            description={`emulator support: ${transport.emulator}.\n
                            physical device support: ${transport.device}. \n
                            Envs: ${transport.env.join(', ')}`}
                        />
                        <ActionColumn>
                            <Checkbox
                                isDisabled={!transport.env.includes(env)}
                                isChecked={debugTransports.includes(transport.name)}
                                onClick={() => {
                                    let nextTransports = [...debugTransports];
                                    if (nextTransports.includes(transport.name)) {
                                        nextTransports.splice(
                                            debugTransports.findIndex(t => t === transport.name),
                                            1,
                                        );
                                    } else {
                                        nextTransports = [...debugTransports, transport.name];
                                    }

                                    setDebugMode({
                                        transports: nextTransports,
                                    });
                                }}
                            />
                        </ActionColumn>
                    </SectionItem>
                );
            })}
        </>
    );
};
