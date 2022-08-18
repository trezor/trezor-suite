import React from 'react';
import { Translation, TroubleshootingTips } from '@suite-components';

const DeviceUnknown = () => (
    <TroubleshootingTips
        label={<Translation id="TR_UNKNOWN_DEVICE" />}
        items={[
            {
                key: 'device-unknown',
                heading: <Translation id="TR_UNKNOWN_DEVICE" />,
                description: 'This is a very rare case. Please contact our support team.',
            },
        ]}
    />
);

export default DeviceUnknown;
