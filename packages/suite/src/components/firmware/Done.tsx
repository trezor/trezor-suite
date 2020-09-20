import React from 'react';

import { SuccessImg, H2, P } from '@firmware-components';
import { useFirmware } from '@suite-hooks';
import { Translation } from '@suite-components';

const Heading = () => <Translation id="TR_SUCCESS" />;

const Body = () => {
    const { prevDevice } = useFirmware();
    const model = prevDevice?.features?.major_version;

    return (
        <>
            {model && <SuccessImg model={model} />}
            <H2>
                <Translation id="FIRMWARE_UPDATE_SUCCESS_HEADING" />
            </H2>
            <P>
                <Translation id="FIRMWARE_UPDATE_SUCCESS_DESC" />
            </P>
        </>
    );
};

export const DoneStep = {
    Heading,
    Body,
};
