import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import PropTypes from 'prop-types';
import Paragraph from 'components/Paragraph';
import colors from 'config/colors';

const Wrapper = styled.div`
    position: relative;
    width: ${props => `${props.size}px`};
    height: ${props => `${props.size}px`};
    display: flex;
    justify-content: center;
    align-items: center;
`;

const SvgWrapper = styled.svg`
    position: absolute;
    width: 100%;
    height: 100%;
    animation: rotate 2s linear infinite;
    transform-origin: center center;
`;

const animationDash = keyframes`
    0% {
        stroke-dasharray: 1, 200;
        stroke-dashoffset: 0;
    }
    50% {
        stroke-dasharray: 89, 200;
        stroke-dashoffset: -35;
    }
    100% {
        stroke-dasharray: 89, 200;
        stroke-dashoffset: -124;
    }
`;

const animationColor = keyframes`
    100%, 0% {
        stroke: ${colors.GREEN_PRIMARY};
    }
    40% {
        stroke: ${colors.GREEN_PRIMARY};
    }
    66% {
        stroke: ${colors.GREEN_SECONDARY};
    }
    80%, 90% {
        stroke: ${colors.GREEN_TERTIARY};
    }
`;

const CircleWrapper = styled.circle`
    ${props => props.isRoute && css`
        stroke: ${colors.GRAY_LIGHT};
    `}

    ${props => props.isPath && css`
        stroke-dasharray: 1, 200;
        stroke-dashoffset: 0;
        animation: ${animationDash} 1.5s ease-in-out infinite, ${animationColor} 6s ease-in-out infinite;
        stroke-linecap: round;
    `};
`;

const Loader = ({
    className, text, size = 100,
}) => (
    <Wrapper
        className={className}
        size={size}
    >
        <Paragraph>{text}</Paragraph>
        <SvgWrapper viewBox="25 25 50 50">
            <CircleWrapper
                cx="50"
                cy="50"
                r="20"
                fill="none"
                stroke=""
                strokeWidth="1"
                strokeMiterlimit="10"
                isRoute
            />
            <CircleWrapper
                cx="50"
                cy="50"
                r="20"
                fill="none"
                strokeWidth="1"
                strokeMiterlimit="10"
                isPath
            />
        </SvgWrapper>
    </Wrapper>
);

Loader.propTypes = {
    className: PropTypes.string,
    text: PropTypes.string,
    size: PropTypes.number,
};

export default Loader;
