import React from 'react';
import { P } from '@trezor/components-v2';

export default () => (
    <>
        <P data-test="seedless-message">
            Your device is in seedless mode and is not allowed to be used with this wallet.
        </P>
    </>
);
