import React from 'react';
import { Translation } from '@suite-components/Translation';
import { TroubleshootingTips } from '@onboarding-components';

interface Props {
    showWebUsb: boolean;
}

const tips = [
    {
        key: '1',
        heading: <Translation id="TR_RECONNECT_TEXT" />,
        description: <Translation id="TR_RECONNECT_TROUBLESHOOT_CONNECTION" />,
    },
    {
        key: '3',
        heading: <Translation id="TR_RECONNECT_TROUBLESHOOT_CABLE" />,
        description: 'Connect it directly to computer, no hubs.',
    },
    {
        key: '4',
        heading: <Translation id="TR_RECONNECT_TROUBLESHOOT_BRIDGE" />,
    },
];

const Reconnect = ({ showWebUsb }: Props) => (
    <TroubleshootingTips
        label={<Translation id="TR_STILL_DONT_SEE_YOUR_TREZOR" />}
        items={tips}
        offerWebUsb={showWebUsb}
    />
);
export default Reconnect;
