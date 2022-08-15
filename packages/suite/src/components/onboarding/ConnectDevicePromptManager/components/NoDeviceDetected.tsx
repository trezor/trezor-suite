import React from 'react';
import styled from 'styled-components';
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
import { motion } from 'framer-motion';
import { enterEase } from '@suite-config/animation';

const Wrapper = styled(motion.div)`
    display: flex;
`;

interface Props {
    offerWebUsb: boolean;
}
const NoDeviceDetected = ({ offerWebUsb }: Props) => (
    <Wrapper
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5, ease: enterEase }}
    >
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
    </Wrapper>
);

export default NoDeviceDetected;
