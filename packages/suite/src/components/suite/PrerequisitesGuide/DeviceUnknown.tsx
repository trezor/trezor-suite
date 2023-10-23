import { Translation, TroubleshootingTips } from 'src/components/suite';

export const DeviceUnknown = () => (
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
