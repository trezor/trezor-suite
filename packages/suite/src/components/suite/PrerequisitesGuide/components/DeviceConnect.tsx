import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

import { Translation, TroubleshootingTips, WebUsbButton } from '@suite-components';

import {
    TROUBLESHOOTING_TIP_BRIDGE_STATUS,
    TROUBLESHOOTING_TIP_BRIDGE_USE,
    TROUBLESHOOTING_TIP_CABLE,
    TROUBLESHOOTING_TIP_USB,
    TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
    TROUBLESHOOTING_TIP_UDEV,
} from '@suite-components/TroubleshootingTips/tips';
import { enterEase } from '@suite-config/animation';

const Wrapper = styled(motion.div)`
    display: flex;
`;

interface DeviceConnectProps {
    isWebUsbTransport: boolean;
}

const DeviceConnect = ({ isWebUsbTransport }: DeviceConnectProps) => {
    const items = isWebUsbTransport
        ? [
              TROUBLESHOOTING_TIP_UDEV,
              TROUBLESHOOTING_TIP_CABLE,
              TROUBLESHOOTING_TIP_USB,
              TROUBLESHOOTING_TIP_BRIDGE_USE,
          ]
        : [
              TROUBLESHOOTING_TIP_BRIDGE_STATUS,
              TROUBLESHOOTING_TIP_UDEV,
              TROUBLESHOOTING_TIP_CABLE,
              TROUBLESHOOTING_TIP_USB,
              TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
          ];

    return (
        <Wrapper
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5, ease: enterEase }}
        >
            <TroubleshootingTips
                label={<Translation id="TR_STILL_DONT_SEE_YOUR_TREZOR" />}
                items={items}
                offerWebUsb={isWebUsbTransport}
                cta={isWebUsbTransport ? <WebUsbButton icon="SEARCH" /> : undefined}
            />
        </Wrapper>
    );
};

export default DeviceConnect;
