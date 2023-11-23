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

type SkeletonBaseProps = {
    background?: string;
    animate?: boolean;
};

type SkeletonRectangleProps = SkeletonBaseProps & {
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
};

type SkeletonCircleProps = SkeletonBaseProps & {
    size?: string | number;
};

const getValue = (value: string | number | undefined) => {
    if (!value) return null;
    if (typeof value === 'number') return `${value}px`;
    return value;
};

export const SkeletonRectangle = styled.div<SkeletonRectangleProps>`
    width: ${({ width }) => getValue(width) ?? '80px'};
    height: ${({ height }) => getValue(height) ?? '20px'};
    background: ${({ background, theme }) => background ?? theme.BG_GREY_ALT};
    border-radius: ${({ borderRadius }) => getValue(borderRadius) ?? '4px'};
    background-size: 200%;

    ${props =>
        props.animate &&
        css`
            ${shimmerEffect}
        `}
`;

export const SkeletonCircle = styled.div<SkeletonCircleProps>`
    ${({ size }) => `
        width: ${getValue(size) ?? '24px'};
        height: ${getValue(size) ?? '24px'};
        border-radius: ${getValue(size) ?? '24px'};
    `}
    background: ${({ background, theme }) => background ?? theme.BG_GREY_ALT};
    background-size: 200%;

    ${props =>
        props.animate &&
        css`
            ${shimmerEffect}
        `}
`;
