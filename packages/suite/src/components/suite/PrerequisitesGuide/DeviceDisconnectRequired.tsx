import { Translation } from '@suite/intl';

import { TroubleshootingTips } from 'src/components/suite/troubleshooting/TroubleshootingTips';

export const DeviceDisconnectRequired = () => (
    <TroubleshootingTips
        intent="warning"
        items={[
            {
                key: 'disconnect-your-device',
                heading: <Translation id="TR_DISCONNECT_YOUR_DEVICE" />,
                description: <Translation id="DISCONNECT_DEVICE_DESCRIPTION" />,
                icon: 'plugs',
            },
        ]}
    />
);
