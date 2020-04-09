import React from 'react';
import { P } from '@trezor/components';
import { Translation } from '@suite-components';

export default () => (
    <>
        <P data-test="seedless-message">
            <Translation id="TR_YOUR_DEVICE_IS_SEEDLESS" />
        </P>
    </>
);
