import { Translation } from 'src/components/suite/Translation';
import { TroubleshootingTips } from 'src/components/suite/troubleshooting/TroubleshootingTips';

export const DeviceDisconnectRequired = () => (
    <TroubleshootingTips
        initiallyIsOpen={true}
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
