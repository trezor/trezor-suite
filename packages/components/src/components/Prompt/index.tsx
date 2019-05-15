import React from 'react';
import styled, { keyframes } from 'styled-components';
import PropTypes from 'prop-types';
import Icon from 'components/Icon';

import icons from 'config/icons';
import { Omit, iconShape } from 'support/types';
import colors from 'config/colors';

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

const modelToIcon = (model: number) => {
    const mapping: { [key: number]: iconShape } = {
        1: icons.T1,
        2: icons.T2,
    };
    return mapping[model];
};
interface Props extends React.HTMLAttributes<HTMLDivElement> {
    model: number;
    size?: number;
}

const Prompt = ({ model, size, children }: Props) => {
    return (
        <Wrapper>
            <ImgWrapper size={size}>
                <Pulse />
                <Icon icon={modelToIcon(model)} size={size} color={colors.GREEN_PRIMARY} />
            </ImgWrapper>
            <ContentWrapper>{children}</ContentWrapper>
        </Wrapper>
    );
};

Prompt.propTypes = {
    model: PropTypes.oneOf([1, 2]).isRequired,
    children: PropTypes.node.isRequired,
    size: PropTypes.number,
};

Prompt.defaultProps = {
    size: 32,
};

export default Prompt;
