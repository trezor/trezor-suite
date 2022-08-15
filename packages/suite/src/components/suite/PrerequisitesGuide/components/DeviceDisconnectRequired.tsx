import React from 'react';
import styled from 'styled-components';

import { Translation, TroubleshootingTips } from '@suite-components';
import { motion } from 'framer-motion';
import { enterEase } from '@suite-config/animation';

const Wrapper = styled(motion.div)`
    display: flex;
`;

const DeviceDisconnectRequired = () => (
    <Wrapper
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5, ease: enterEase }}
    >
        <TroubleshootingTips
            label={<Translation id="TR_DISCONNECT_YOUR_DEVICE" />}
            items={[
                {
                    key: 'disconnect-your-device',
                    heading: <Translation id="TR_DISCONNECT_YOUR_DEVICE" />,
                    description: <Translation id="DISCONNECT_DEVICE_DESCRIPTION" />,
                },
            ]}
        />
    </Wrapper>
);

export default DeviceDisconnectRequired;
