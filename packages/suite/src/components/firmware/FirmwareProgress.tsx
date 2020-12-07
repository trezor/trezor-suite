import React from 'react';
import { getTextForStatus, getDescriptionForStatus } from '@firmware-utils';
import { Translation } from '@suite-components';
import { Loaders } from '@onboarding-components';
import { useFirmware } from '@suite-hooks';
import { InitImg, P, H2 } from '@firmware-components';

const Body = () => {
    const { status, prevDevice, device } = useFirmware();

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
        </>
    );
};

export const FirmwareProgressStep = {
    Body,
};
