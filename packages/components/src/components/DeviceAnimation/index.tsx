import styled from 'styled-components';
import React, { ReactNode } from 'react';
import Lottie from 'lottie-react';
import LottieTTConnect from './lottie/TT_Connect_Text.json';

const Wrapper = styled.div<{ size: number }>`
    width: ${props => props.size}px;
    height: ${props => props.size}px;
    border-radius: 50%;
    background: ${props => props.theme.BG_GREY};
    overflow: hidden;
`;

const StyledLottie = styled(Lottie)`
    width: 100%;
    height: 100%;
`;

type DeviceAnimationType = 'CONNECT_TT';

type Props = {
    size?: number;
    type: DeviceAnimationType;
    loop?: boolean;
};

const DeviceAnimation = ({ size = 100, type, loop = false, ...props }: Props) => (
    <Wrapper size={size} {...props}>
        {type === 'CONNECT_TT' && <StyledLottie animationData={LottieTTConnect} loop={loop} />}
    </Wrapper>
);

export { DeviceAnimation, Props as DeviceAnimationProps };
