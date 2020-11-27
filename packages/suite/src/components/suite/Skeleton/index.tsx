import styled, { css, keyframes } from 'styled-components';

interface StackProps {
    col?: boolean;
    grow?: boolean;
    margin?: string;
    childMargin?: string;
    alignItems?: string;
}
const Stack = styled.div<StackProps>`
    display: flex;
    align-items: ${props => props.alignItems ?? 'auto'};
    flex-direction: ${props => (props.col ? 'column' : 'row')};
    flex-grow: ${props => (props.grow ? 1 : 0)};
    ${props =>
        props.margin &&
        css`
            margin: ${props.margin};
        `}
    ${props =>
        props.childMargin &&
        css`
            div {
                margin: ${props.childMargin};
            }
        `}
`;

const Spread = styled(Stack)<
    StackProps & {
        spaceAround?: boolean;
    }
>`
    justify-content: ${props => (props.spaceAround ? 'space-around' : 'space-between')};
`;

const SHINE = keyframes`
    0% {
        left: -100%;
        transition-property: left;

    }
    100% {
        left: 100%;
        transition-property: left;
    }
`;

export const shimmerEffect = css`
    position: relative;
    overflow: hidden;
    &::after {
        animation: ${SHINE} 2s ease-in-out infinite;
        animation-fill-mode: forwards;
        content: '';
        position: absolute;
        left: -100%;
        width: 100%;
        height: 100%;

        background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.25) 25%,
            rgba(255, 255, 255, 0.3) 50%,
            rgba(255, 255, 255, 0) 75%
        );
    }
`;

const SkeletonRectangle = styled.div<SkeletonProps>`
    width: ${props => props.width ?? '80px'};
    height: ${props => props.height ?? '20px'};
    background: ${props => props.background ?? props.theme.BG_GREY_ALT};
    border-radius: ${props => props.borderRadius ?? '4px'};
    ${props =>
        props.animate &&
        css`
            ${shimmerEffect}
        `}
`;

const SkeletonCircle = styled.div<SkeletonProps>`
    width: ${props => props.size ?? '24px'};
    height: ${props => props.size ?? '24px'};
    border-radius: ${props => props.size ?? '24px'};
    background: ${props => props.background ?? props.theme.BG_GREY_ALT};
    ${props =>
        props.animate &&
        css`
            ${shimmerEffect}
        `}
`;

interface SkeletonProps {
    width?: string;
    height?: string;
    size?: string;
    background?: string;
    animate?: boolean;
    borderRadius?: string;
    alignItems?: string;
}

export { SkeletonRectangle, SkeletonCircle, Spread, Stack };
