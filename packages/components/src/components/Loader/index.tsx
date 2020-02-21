import React from 'react';
import styled, { css } from 'styled-components';

import { DASH, GREEN_COLOR } from '../../config/animations';
import { FONT_SIZE } from '../../config/variables';
import { P } from '../Paragraph';
import colors from '../../config/colors';

const Wrapper = styled.div<Props>`
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

type CircleProps = Props & {
    isRoute?: boolean;
    isPath?: boolean;
};
const CircleWrapper = styled.circle<CircleProps>`
    ${props =>
        props.isRoute &&
        css`
            stroke: ${props.transparentRoute ? 'transparent' : colors.BLACK98};
        `}

    ${props =>
        props.isPath &&
        css`
            stroke-width: ${props.strokeWidth}px;
            stroke-dasharray: 1, 200;
            stroke-dashoffset: 0;
            animation: ${DASH} 1.5s ease-in-out infinite,
                ${props.animationColor || GREEN_COLOR} 6s ease-in-out infinite;
            stroke-linecap: round;
        `};
`;

const StyledParagraph = styled(P)<Props>`
    font-size: ${props => (props.isSmallText ? FONT_SIZE.SMALL : FONT_SIZE.NORMAL)};
    color: ${props => (props.isWhiteText ? colors.WHITE : colors.BLACK25)};
`;

interface Props {
    className?: string;
    text?: string;
    isWhiteText?: boolean;
    isSmallText?: boolean;
    transparentRoute?: boolean;
    size?: number;
    strokeWidth?: number;
    animationColor?: any;
}

const Loader = ({
    className,
    text,
    isWhiteText = false,
    isSmallText,
    size = 100,
    animationColor,
    transparentRoute,
    strokeWidth = 2,
    ...rest
}: Props) => (
    <Wrapper className={className} size={size} {...rest}>
        <StyledParagraph isSmallText={isSmallText} isWhiteText={isWhiteText}>
            {text}
        </StyledParagraph>
        <SvgWrapper viewBox="25 25 50 50">
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

export { Loader, Props as LoaderProps };
