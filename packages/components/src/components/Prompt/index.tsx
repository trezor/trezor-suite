import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Icon } from '../Icon';

import { Omit, IconType } from '../../support/types';
import colors from '../../config/colors';
import { getDeviceIcon } from '../../utils/icons';

const PulseAnimation = keyframes`
    0% {
        background-color: ${colors.GREEN_PRIMARY};
        transform: scale(0);
        opacity: 0;
    }
    25% {
        background-color: ${colors.GREEN_PRIMARY};
        transform: scale(0.75);
        opacity: 0.2;
    }
    50% {
        transform: scale(1.5);
        opacity: 0.3;
    }
    100% {
        opacity: 0;
        transform: scale(4);
    }
`;

const Pulse = styled.div`
    position: absolute;
    animation: ${PulseAnimation} 1s ease-out infinite;
    animation-delay: 1s;
    border-radius: 50%;
    width: 100%;
    height: 100%;
`;

const ImgWrapper = styled.div<Omit<Props, 'model'>>`
    position: relative;
    height: ${props => props.size}px;
    width: ${props => props.size}px;
`;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
`;

const ContentWrapper = styled.div`
    max-width: 300px;
    color: ${colors.GREEN_PRIMARY};
    text-align: center;
    margin: 5px;
`;
interface Props extends React.HTMLAttributes<HTMLDivElement> {
    model: number;
    size?: number;
}

const Prompt = ({ model, size, children, ...rest }: Props) => {
    return (
        <Wrapper {...rest}>
            <ImgWrapper size={size}>
                <Pulse />
                <Icon icon={getDeviceIcon(model)} size={size} color={colors.GREEN_PRIMARY} />
            </ImgWrapper>
            <ContentWrapper>{children}</ContentWrapper>
        </Wrapper>
    );
};

Prompt.defaultProps = {
    size: 32,
};

export { Prompt, Props as PromptProps };
