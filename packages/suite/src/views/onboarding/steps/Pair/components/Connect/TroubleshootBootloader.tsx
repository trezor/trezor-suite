import React from 'react';
import { P } from '@trezor/components';
import messages from '@suite/support/messages';
import { Translation } from '@suite-components/Translation';

const TroubleshootBootloader = () => (
    <>
        <P>
            <Translation {...messages.TR_DEVICE_IN_BOOTLOADER_MODE_INSTRUCTIONS} />
        </P>
    </>
);

export default TroubleshootBootloader;
