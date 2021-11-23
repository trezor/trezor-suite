import React from 'react';
import { useSpring, config, animated } from 'react-spring';
import styled from 'styled-components';

import { Translation, TroubleshootingTips } from '@suite-components';

const Wrapper = styled(animated.div)`
    display: flex;
`;

const DeviceDisconnectRequired = () => {
    const fadeStyles = useSpring({
        config: { ...config.default },
        delay: 1000,
        from: { opacity: 0 },
        to: { opacity: 1 },
    });

    return (
        <Wrapper style={fadeStyles}>
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
};

export default DeviceDisconnectRequired;
