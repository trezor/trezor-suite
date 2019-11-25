import React from 'react';
import { P } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import l10nMessages from './TroubleshootBootloader.messages';

const TroubleshootBootloader = () => (
    <>
        <P>
            <FormattedMessage {...l10nMessages.TR_DEVICE_IN_BOOTLOADER_MODE_INSTRUCTIONS} />
        </P>
    </>
);

export default TroubleshootBootloader;
