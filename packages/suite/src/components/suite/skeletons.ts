import styled, { css, keyframes } from 'styled-components';

interface SkeletonStackProps {
    col?: boolean;
    grow?: boolean;
    margin?: string;
    childMargin?: string;
    alignItems?: string;
}
export const SkeletonStack = styled.div<SkeletonStackProps>`
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

export const SkeletonSpread = styled(SkeletonStack)<
    SkeletonStackProps & {
        spaceAround?: boolean;
    }
>`
    justify-content: ${props => (props.spaceAround ? 'space-around' : 'space-between')};
`;

const SHINE = keyframes`
    from {
        background-position: 0 0;
    }
    to {
        background-position: -200% 0;
    }
`;

const shimmerEffect = css`
    animation: ${SHINE} 1.5s ease infinite;
    background: linear-gradient(
        90deg,
        ${({ theme }) =>
            `${theme.GRADIENT_SKELETON_START}, ${theme.BG_GREY_ALT}, ${theme.GRADIENT_SKELETON_START}`}
    );
    background-size: 200%;
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

export const SkeletonRectangle = styled.div<SkeletonProps>`
    width: ${props => props.width ?? '80px'};
    height: ${props => props.height ?? '20px'};
    background: ${({ background, theme }) => background ?? theme.BG_GREY_ALT};
    border-radius: ${props => props.borderRadius ?? '4px'};
    background-size: 200%;

    ${props =>
        props.animate &&
        css`
            ${shimmerEffect}
        `}
`;

export const SkeletonCircle = styled.div<SkeletonProps>`
    width: ${props => props.size ?? '24px'};
    height: ${props => props.size ?? '24px'};
    border-radius: ${props => props.size ?? '24px'};
    background: ${({ background, theme }) => background ?? theme.BG_GREY_ALT};
    background-size: 200%;

    ${props =>
        props.animate &&
        css`
            ${shimmerEffect}
        `}
`;
