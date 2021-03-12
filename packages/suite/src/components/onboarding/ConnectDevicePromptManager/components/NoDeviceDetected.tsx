import React from 'react';
import { useSpring, config, animated } from 'react-spring';
import styled from 'styled-components';
import { isWeb } from '@suite-utils/env';
import { TroubleshootingTips } from '@onboarding-components';
import { Translation } from '@suite-components';

const Wrapper = styled(animated.div)`
    display: flex;
`;

const tips = [
    {
        key: '1',
        heading: 'Make sure Trezor Bridge is installed and running',
        description: 'There should be probably a link to download it somewhere',
        hide: !isWeb(),
    },
    {
        key: '2',
        heading: 'Try incognito mode',
        description: 'Just in case',
        hide: !isWeb(),
    },
    {
        key: '3',
        heading: 'Try a different USB or port',
        description: 'Connect it directly to computer, no hubs.',
    },
    {
        key: '4',
        heading: 'Try using a different computer, if you can',
        description: 'With Trezor Bridge installed',
    },
];
interface Props {
    offerWebUsb: boolean;
}
const NoDeviceDetected = ({ offerWebUsb }: Props) => {
    const fadeStyles = useSpring({
        config: { ...config.default },
        delay: 1000,
        from: { opacity: 0 },
        to: { opacity: 1 },
    });

    return (
        <Wrapper style={fadeStyles}>
            <TroubleshootingTips
                label={<Translation id="TR_STILL_DONT_SEE_YOUR_TREZOR" />}
                items={tips}
                offerWebUsb={offerWebUsb}
            />
        </Wrapper>
    );
};

export default NoDeviceDetected;
