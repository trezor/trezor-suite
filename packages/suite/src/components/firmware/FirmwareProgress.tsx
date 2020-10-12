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
    const { status } = useFirmware();

    // if device is not connected, there must be error which is handled by another component
    if (!device?.connected || !device?.features || !device?.firmwareRelease) {
        return null;
    }

    const statusText = getTextForStatus(status);
    const statusDescription = getDescriptionForStatus(status);
    return (
        <>
            <InitImg model={device.features.major_version} />

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

            {status === 'check-fingerprint' && (
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
