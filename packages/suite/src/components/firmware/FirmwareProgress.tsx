import React from 'react';
import {
    getFormattedFingerprint,
    getTextForStatus,
    getDescriptionForStatus,
} from '@firmware-utils';
import { Translation } from '@suite-components';
import { Loaders } from '@onboarding-components';
import { useDevice, useFirmware } from '@suite-hooks';
import { Fingerprint, InitImg, P, H2 } from '@firmware-components';

const Body = () => {
    const { device } = useDevice();
    const { status, prevDevice } = useFirmware();

    const statusText = getTextForStatus(status);
    const statusDescription = getDescriptionForStatus(status);
    return (
        <>
            <InitImg
                model={device?.features?.major_version || prevDevice?.features?.major_version || 2}
            />

            {statusText && (
                <>
                    <H2>
                        <Translation id={statusText} />
                        <Loaders.Dots />
                    </H2>
                    {statusDescription && (
                        <P>
                            <Translation id={statusDescription} />
                        </P>
                    )}
                </>
            )}

            {status === 'check-fingerprint' && device?.firmwareRelease?.release?.fingerprint && (
                <Fingerprint>
                    {getFormattedFingerprint(device.firmwareRelease.release.fingerprint)}
                </Fingerprint>
            )}
        </>
    );
};

export const FirmwareProgressStep = {
    Body,
};
