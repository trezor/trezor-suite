import React from 'react';

import { SuccessImg, P, H2 } from '@firmware-components';
import { Translation } from '@suite-components';
import { useDevice } from '@suite-hooks/useDevice';

const Body = () => {
    const { device } = useDevice();
    return (
        <>
            <H2>
                <Translation id="TR_FIRMWARE_PARTIALLY_UPDATED" />
            </H2>
            <P>
                <Translation id="TR_BUT_THERE_IS_ANOTHER_UPDATE" />
            </P>
            {device?.features?.major_version && (
                <SuccessImg model={device.features.major_version} />
            )}
        </>
    );
};

export const PartiallyDoneStep = {
    Body,
};
