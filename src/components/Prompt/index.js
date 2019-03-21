import React from 'react';
import styled, { keyframes } from 'styled-components';
import PropTypes from 'prop-types';

import P from 'components/Paragraph';
import Icon from 'components/Icon';

import icons from 'config/icons';
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

const ImgWrapper = styled.div`
    position: relative;
`;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
`;

const TextWrapper = styled(P)`
    max-width: 300px;
    color: ${colors.GREEN_PRIMARY};
`;

const modelToIcon = model => {
    const mapping = {
        1: icons.T1,
        2: icons.T2,
    };
    return mapping[model];
};

const Prompt = ({ text, model }) => (
    <Wrapper>
        <ImgWrapper>
            <Pulse />
            <Icon icon={modelToIcon(model)} size={64} color={colors.GREEN_PRIMARY} />
        </ImgWrapper>
        <TextWrapper>{text}</TextWrapper>
    </Wrapper>
);

Prompt.propTypes = {
    model: PropTypes.oneOf([1, 2]).isRequired,
    text: PropTypes.string,
};

export default Prompt;
