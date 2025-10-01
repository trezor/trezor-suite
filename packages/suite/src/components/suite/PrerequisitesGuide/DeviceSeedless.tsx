import { TroubleshootingTips } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';

// Seedless devices are not supported by Trezor Suite
export const DeviceSeedless = () => (
    <TroubleshootingTips
        label={<Translation id="TR_YOUR_DEVICE_IS_SEEDLESS" />}
        variant="info"
        items={[
            {
                key: 'device-seedless',
                heading: <Translation id="TR_SEEDLESS_SETUP_IS_NOT_SUPPORTED_TITLE" />,
                description: <Translation id="TR_SEEDLESS_SETUP_IS_NOT_SUPPORTED_DESCRIPTION" />,
            },
        ]}
    />
);
