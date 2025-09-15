import { useEffect, useState } from 'react';

import { DotIndicator } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { Url } from '@trezor/urls';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';

export const BluetoothServerStatus = () => {
    const [status, setStatus] = useState<
        | { type: 'unknown' }
        | {
              type: 'success';
              // process and service not used now
              process: boolean;
              service: boolean;
              url: string;
          }
        | { type: 'error'; error: string }
    >({ type: 'unknown' });

    useEffect(() => {
        desktopApi.getBluetoothStatus().then(result => {
            console.log(result);
            if (result.success) {
                setStatus({ type: 'success', ...result.payload });
            } else {
                setStatus({ type: 'error', error: result.error });
            }
        });
    }, []);

    if (status.type === 'unknown' || status.type === 'error') {
        return null;
    }

    console.log(status);

    return (
        <SectionItem>
            <TextColumn
                title="Bluetooth status page"
                description="Bluetooth debugging tool available only in dev builds."
                buttonTitle="Status page"
                buttonLink={status.url as Url}
            />
            <ActionColumn>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <DotIndicator isActive={status.process} />
                        <span>Process</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <DotIndicator isActive={status.service} />
                        <span>Service</span>
                    </div>
                </div>
            </ActionColumn>
        </SectionItem>
    );
};
