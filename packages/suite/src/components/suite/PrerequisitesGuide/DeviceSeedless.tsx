import { Translation } from 'src/components/suite/Translation';
import { TroubleshootingTips } from 'src/components/suite/troubleshooting/TroubleshootingTips';

// Seedless devices are not supported by Trezor Suite
export const DeviceSeedless = () => (
    <TroubleshootingTips
        intent="info"
        items={[
            {
                key: 'device-seedless',
                heading: <Translation id="TR_SEEDLESS_SETUP_IS_NOT_SUPPORTED_TITLE" />,
                description: <Translation id="TR_SEEDLESS_SETUP_IS_NOT_SUPPORTED_DESCRIPTION" />,
                icon: 'trezorBody',
            },
        ]}
    />
);
