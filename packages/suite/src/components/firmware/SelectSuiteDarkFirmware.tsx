import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { Banner, Column } from '@trezor/components';

// Suite Dark flavour: the unofficial firmware is published to the flavour's own
// firmware-dark GitHub "continuous" release, one versionless asset per model.
// github.com is allowlisted in the desktop request-filter and CSP connect-src is
// permissive, so this renderer fetch is permitted.
const FIRMWARE_DARK_BASE =
    'https://github.com/suite-dark/firmware-dark/releases/download/continuous';

type SelectSuiteDarkFirmwareProps = {
    setFirmwareBinary: Dispatch<SetStateAction<ArrayBuffer | undefined>>;
};

export const SelectSuiteDarkFirmware = ({ setFirmwareBinary }: SelectSuiteDarkFirmwareProps) => {
    const { device } = useDevice();
    const model = device?.features?.internal_model;
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

    useEffect(() => {
        let cancelled = false;
        setStatus('loading');
        setFirmwareBinary(undefined);

        const load = async () => {
            if (!model) {
                if (!cancelled) setStatus('error');

                return;
            }
            try {
                const response = await fetch(`${FIRMWARE_DARK_BASE}/FirmwareDark-${model}.bin`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const buffer = await response.arrayBuffer();
                // guard against downloading an error page instead of a real image
                if (buffer.byteLength < 1024) throw new Error('Firmware binary too small');
                if (!cancelled) {
                    setFirmwareBinary(buffer);
                    setStatus('ready');
                }
            } catch {
                if (!cancelled) setStatus('error');
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [model, setFirmwareBinary]);

    return (
        <Column gap={16}>
            <Banner
                intent="warning"
                description={<Translation id="TR_SUITE_DARK_FIRMWARE_WARNING" />}
            />
            {status === 'loading' && (
                <Banner
                    intent="info"
                    description={<Translation id="TR_SUITE_DARK_FIRMWARE_DOWNLOADING" />}
                />
            )}
            {status === 'ready' && (
                <Banner
                    intent="info"
                    description={<Translation id="TR_SUITE_DARK_FIRMWARE_READY" />}
                />
            )}
            {status === 'error' && (
                <Banner
                    intent="warning"
                    description={<Translation id="TR_SUITE_DARK_FIRMWARE_DOWNLOAD_ERROR" />}
                />
            )}
        </Column>
    );
};
