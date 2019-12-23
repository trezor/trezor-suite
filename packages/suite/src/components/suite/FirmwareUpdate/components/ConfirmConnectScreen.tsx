import React from 'react';
import { P } from '@trezor/components-v2';

const ConfirmConnectScreen = () => {
    return (
        <>
            <P>Confirm connect</P>
            <P>When connecting to bootloader mode, you must confirm this manualy on touchscreen</P>
            {/* <Link>Skip this update</Link> */}
        </>
    );
};

export default ConfirmConnectScreen;
