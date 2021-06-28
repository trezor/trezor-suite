import React from 'react';
import { useSpring, config, animated } from 'react-spring';
import styled from 'styled-components';

import { Translation, TroubleshootingTips, WebusbButton } from '@suite-components';

import {
    TROUBLESHOOTING_TIP_BRIDGE_STATUS,
    TROUBLESHOOTING_TIP_BRIDGE_USE,
    TROUBLESHOOTING_TIP_CABLE,
    TROUBLESHOOTING_TIP_USB,
    TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
    TROUBLESHOOTING_TIP_UDEV,
} from '@suite-components/TroubleshootingTips/tips';

const Wrapper = styled(animated.div)`
    display: flex;
`;

interface Props {
    offerWebUsb: boolean;
}

const DeviceConnect = ({ offerWebUsb }: Props) => {
    const fadeStyles = useSpring({
        config: { ...config.default },
        delay: 1000,
        from: { opacity: 0 },
        to: { opacity: 1 },
    });

    const items = offerWebUsb
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
        <Wrapper style={fadeStyles}>
            <TroubleshootingTips
                label={<Translation id="TR_STILL_DONT_SEE_YOUR_TREZOR" />}
                items={items}
                offerWebUsb={offerWebUsb}
                cta={offerWebUsb ? <WebusbButton icon="SEARCH" /> : undefined}
            />
        </Wrapper>
    );
};

export default DeviceConnect;
