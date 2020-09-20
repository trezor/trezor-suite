import React from 'react';
import { getFormattedFingerprint, getTextForStatus } from '@firmware-utils';
import { Translation } from '@suite-components';
import { Loaders } from '@onboarding-components';
import { useDevice, useFirmware } from '@suite-hooks';
import { Fingerprint, InitImg, P, H2 } from '@firmware-components';

const Body = () => {
    const { device } = useDevice();
    const { status } = useFirmware();

    // if device is not connected, there must be error which is handled by another component
    if (!device?.connected || !device?.features) {
        return null;
    }

    const statusText = getTextForStatus(status);
    return (
        <>
            <InitImg model={device.features.major_version} />

            {statusText && (
                <H2>
                    <Translation id={statusText} />
                    <Loaders.Dots />
                </H2>
            )}

            {status === 'installing' ? (
                <P>
                    <Translation id="TR_DO_NOT_DISCONNECT" />
                </P>
            ) : (
                // empty to avoid jumping
                <P> </P>
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
