import React from 'react';
import styled, { keyframes } from 'styled-components';
import PropTypes from 'prop-types';

import P from 'components/Paragraph';
import Icon from 'components/Icon';

import icons from 'config/icons';
import colors from 'config/colors';

const ripple = keyframes`
    0%, 35% {
        background-color: ${colors.GREEN_PRIMARY};
        transform: scale(0);
        opacity: 1;
    }
    50% {
        transform: scale(1.5);
        opacity: 0.2;
    }
    100% {
        opacity: 0;
        transform: scale(4);
    }
`;

const Ripple = styled.div`
    position: absolute;
    animation: ${ripple} 1.2s ease-out infinite;
    animation-delay: 1s;
    border-radius: 50%;
    width: 100%;
    height: 100%;
`;

const TrezorImgWrapper = styled.div`
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
        '1': icons.T1,
        '2': icons.T1, // TODO: t2 icon not in icons yet.
    };
    return mapping[model];
};

const Prompt = ({ text, model }) => (
    <Wrapper>
        <TrezorImgWrapper>
            <Ripple />
            <Icon icon={modelToIcon(model)} size={64} color={colors.GREEN_PRIMARY} />
        </TrezorImgWrapper>
        <TextWrapper>{text}</TextWrapper>
    </Wrapper>
);

Prompt.defaultProps = {
    text: 'Complete action on your device',
};

Prompt.propTypes = {
    text: PropTypes.string,
    model: PropTypes.oneOf(['1', '2']).isRequired,
};

export default Prompt;
