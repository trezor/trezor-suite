import React from 'react';

import { Translation } from '@suite-components';
import { useFirmware } from '@suite-hooks';
import { P, H2, ErrorImg } from '@firmware-components';

const Heading = () => <Translation id="TR_FIRMWARE_INSTALL_FAILED_HEADER" />;

const Body = () => {
    const { error } = useFirmware();
    return (
        <>
            <ErrorImg />
            <H2>
                <Translation id="TR_OOPS_SOMETHING_WENT_WRONG" />
            </H2>
            {/* yeah I know we shouldn't use something called TOAST_ here.. but it is so beautifully generic.. */}
            <P data-test="@firmware/error-message">
                <Translation id="TOAST_GENERIC_ERROR" values={{ error }} />
            </P>
        </>
    );
};

export const ErrorStep = {
    Heading,
    Body,
};
