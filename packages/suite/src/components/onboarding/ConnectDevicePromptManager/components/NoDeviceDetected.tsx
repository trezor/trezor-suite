import React from 'react';
import { Translation } from '@suite-components/Translation';
import { TroubleshootingTips } from '@suite-components';
import {
    TROUBLESHOOTING_TIP_BRIDGE_STATUS,
    TROUBLESHOOTING_TIP_BRIDGE_INSTALL,
    TROUBLESHOOTING_TIP_UDEV,
    TROUBLESHOOTING_TIP_CABLE,
    TROUBLESHOOTING_TIP_USB,
    TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
} from '@suite-components/TroubleshootingTips/tips';

interface Props {
    offerWebUsb: boolean;
}

const NoDeviceDetected = ({ offerWebUsb }: Props) => (
    <TroubleshootingTips
        label={<Translation id="TR_STILL_DONT_SEE_YOUR_TREZOR" />}
        items={[
            TROUBLESHOOTING_TIP_BRIDGE_STATUS,
            TROUBLESHOOTING_TIP_BRIDGE_INSTALL,
            TROUBLESHOOTING_TIP_UDEV,
            TROUBLESHOOTING_TIP_CABLE,
            TROUBLESHOOTING_TIP_USB,
            TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
        ]}
        offerWebUsb={offerWebUsb}
    />
);

export default NoDeviceDetected;
