import { useEffect, useState } from 'react';

import { desktopApi } from '@trezor/suite-desktop-api';
import { Url } from '@trezor/urls';

import { SectionItem, TextColumn } from 'src/components/suite';

export const BluetoothServerStatus = () => {
    const [status, setStatus] = useState<
        | { type: 'unknown' }
        | {
              type: 'success';
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

    if (status.type === 'unknown' || status.type === 'error' || !status.process) {
        // loading, or failed to load, or process reported as false - there might be case when
        // server is not owned by suite-desktop, running on another port, possibly the default one (21327)
        // this case is not handled and we display nothing
        return null;
    }

    return (
        <SectionItem>
            <TextColumn
                title="Bluetooth status page"
                description="Bluetooth debugging tool available only in dev builds."
                buttonTitle="Status page"
                buttonLink={status.url as Url}
            />
        </SectionItem>
    );
};
