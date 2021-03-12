import React from 'react';
import { Translation } from '@suite-components/Translation';
import { TroubleshootingTips } from '@onboarding-components';

interface Props {
    showWebUsb: boolean;
}

const tips = [
    {
        key: 'reconnect',
        heading: <Translation id="TR_RECONNECT_TROUBLESHOOT_CONNECTION" />,
    },
    {
        key: 'usb',
        heading: <Translation id="TR_RECONNECT_TROUBLESHOOT_CABLE" />,
        description: <Translation id="TR_TROUBLESHOOTING_TIP_USB_PORT_DESCRIPTION" />,
    },
    {
        key: 'bridge',
        heading: <Translation id="TR_RECONNECT_TROUBLESHOOT_BRIDGE" />,
    },
];

const Reconnect = ({ showWebUsb }: Props) => (
    <TroubleshootingTips
        label={<Translation id="TR_RECONNECT_TEXT" />}
        items={tips}
        offerWebUsb={showWebUsb}
    />
);
export default Reconnect;
