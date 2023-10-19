import { Translation, TroubleshootingTips } from 'src/components/suite';

// Seedless devices are not supported by Trezor Suite
export const DeviceSeedless = () => (
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
