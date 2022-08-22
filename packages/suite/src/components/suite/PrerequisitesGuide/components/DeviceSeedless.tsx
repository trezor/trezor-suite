import React from 'react';
import { Translation, TroubleshootingTips } from '@suite-components';

// Seedless devices are not supported by Trezor Suite
const DeviceSeedless = () => (
    <TroubleshootingTips
        label={<Translation id="TR_YOUR_DEVICE_IS_SEEDLESS" />}
        items={[
            {
                key: 'device-seedless',
                heading: <Translation id="TR_SEEDLESS_SETUP_IS_NOT_SUPPORTED_TITLE" />,
                description: <Translation id="TR_SEEDLESS_SETUP_IS_NOT_SUPPORTED_DESCRIPTION" />,
            },
        ]}
    />
);

export default DeviceSeedless;
