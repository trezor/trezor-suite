import { Translation } from 'src/components/suite/Translation';
import { TroubleshootingTips } from 'src/components/suite/troubleshooting/TroubleshootingTips';

export const DeviceUnknown = () => (
    <TroubleshootingTips
        label={<Translation id="TR_UNKNOWN_DEVICE" />}
        intent="warning"
        items={[
            {
                key: 'device-unknown',
                heading: <Translation id="TR_UNKNOWN_DEVICE" />,
                description: 'This is a very rare case. Please contact our support team.',
                icon: 'questionSimple',
            },
        ]}
    />
);
