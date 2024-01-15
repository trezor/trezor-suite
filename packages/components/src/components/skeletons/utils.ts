import { css, keyframes } from 'styled-components';

const SHINE = keyframes`
    from {
        background-position: 0 0;
    }
    to {
        background-position: -200% 0;
    }
`;

export const shimmerEffect = css`
    animation: ${SHINE} 1.5s ease infinite;
    background: linear-gradient(
        90deg,
        ${({ theme }) =>
            `${theme.gradientNeutralBottomFadeSurfaceElevation1Start}, ${theme.gradientNeutralBottomFadeSurfaceElevation1End}, ${theme.gradientNeutralBottomFadeSurfaceElevation1Start}`}
    );
    background-size: 200%;
`;

export const getValue = (value: string | number | undefined) => {
    if (!value) return null;
    if (typeof value === 'number') return `${value}px`;
    return value;
};
