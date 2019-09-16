import React from 'react';
import { P } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import l10nMessages from './TroubleshootBootloader.messages';

const TroubleshootBootloader = () => (
    <React.Fragment>
        <P>
            <FormattedMessage {...l10nMessages.TR_DEVICE_IN_BOOTLOADER_MODE_INSTRUCTIONS} />
        </P>
    </React.Fragment>
);

export default TroubleshootBootloader;
