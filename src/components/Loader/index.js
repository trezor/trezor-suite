import React from 'react';
import styled, { css } from 'styled-components';
import PropTypes from 'prop-types';
import Paragraph from 'components/Paragraph';
import { DASH, GREEN_COLOR } from 'config/animations';
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
    ${props => props.isRoute && css`
        stroke: ${colors.GRAY_LIGHT};
    `}

    ${props => props.isPath && css`
        stroke-dasharray: 1, 200;
        stroke-dashoffset: 0;
        animation: ${DASH} 1.5s ease-in-out infinite, ${GREEN_COLOR} 6s ease-in-out infinite;
        stroke-linecap: round;
    `};
`;

const StyledParagraph = styled(Paragraph)`
    color: ${props => (props.isWhiteText ? colors.WHITE : colors.TEXT_PRIMARY)};
`;

const Loader = ({
    className, text, isWhiteText = false, size = 100,
}) => (
    <Wrapper className={className} size={size}>
        <StyledParagraph isWhiteText={isWhiteText}>{text}</StyledParagraph>
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
    isWhiteText: PropTypes.bool,
    className: PropTypes.string,
    text: PropTypes.string,
    size: PropTypes.number,
};

export default Loader;
