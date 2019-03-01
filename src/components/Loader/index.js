import { DASH, GREEN_COLOR } from 'config/animations';
import styled, { css } from 'styled-components';

import { FONT_SIZE } from 'config/variables';
import Paragraph from 'components/Paragraph';
import PropTypes from 'prop-types';
import React from 'react';
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

const CircleWrapper = styled.circle`
    ${props => props.isRoute
        && css`
            stroke: ${props.transparentRoute
        ? 'transparent'
        : colors.GRAY_LIGHT};
        `}

    ${props => props.isPath
        && css`
            stroke-width: ${props.strokeWidth}px;
            stroke-dasharray: 1, 200;
            stroke-dashoffset: 0;
            animation: ${DASH} 1.5s ease-in-out infinite,
                ${props.animationColor || GREEN_COLOR} 6s ease-in-out infinite;
            stroke-linecap: round;
        `};
`;

const StyledParagraph = styled(Paragraph)`
    font-size: ${props => (props.isSmallText ? FONT_SIZE.SMALL : FONT_SIZE.BIG)};
    color: ${props => (props.isWhiteText ? colors.WHITE : colors.TEXT_PRIMARY)};
`;

const Loader = ({
    className,
    text,
    isWhiteText = false,
    isSmallText,
    size = 100,
    animationColor,
    transparentRoute,
    strokeWidth = 1,
}) => (
    <Wrapper className={className} size={size}>
        <StyledParagraph isSmallText={isSmallText} isWhiteText={isWhiteText}>
            {text}
        </StyledParagraph>
        <SvgWrapper viewBox="25 25 50 50" css={css`animation: rotate 2s linear infinite;`}>
            <CircleWrapper
                animationColor={animationColor}
                cx="50"
                cy="50"
                r="20"
                fill="none"
                stroke=""
                strokeMiterlimit="10"
                isRoute
                transparentRoute={transparentRoute}
                strokeWidth={strokeWidth}
            />
            <CircleWrapper
                css={css`animation: ${DASH} 1.5s ease-in-out infinite;`}
                animationColor={animationColor}
                cx="50"
                cy="50"
                r="20"
                fill="none"
                strokeMiterlimit="10"
                isPath
                transparentRoute={transparentRoute}
                strokeWidth={strokeWidth}
            />
        </SvgWrapper>
    </Wrapper>
);

Loader.propTypes = {
    isWhiteText: PropTypes.bool,
    isSmallText: PropTypes.bool,
    className: PropTypes.string,
    text: PropTypes.string,
    animationColor: PropTypes.object,
    transparentRoute: PropTypes.bool,
    size: PropTypes.number,
    strokeWidth: PropTypes.number,
};

export default Loader;
