import { Translation } from '@suite/intl';
import { TrezorBodyIcon } from '@trezor/icons';

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
                icon: TrezorBodyIcon,
            },
        ]}
    />
);
