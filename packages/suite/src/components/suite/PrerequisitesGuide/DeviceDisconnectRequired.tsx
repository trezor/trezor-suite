import { TroubleshootingTips } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';

export const DeviceDisconnectRequired = () => (
    <TroubleshootingTips
        initiallyIsOpen={true}
        label={<Translation id="TR_DISCONNECT_YOUR_DEVICE" />}
        intent="warning"
        items={[
            {
                key: 'disconnect-your-device',
                heading: <Translation id="TR_DISCONNECT_YOUR_DEVICE" />,
                description: <Translation id="DISCONNECT_DEVICE_DESCRIPTION" />,
            },
        ]}
    />
);
