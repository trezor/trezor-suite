import styled from 'styled-components';

export const ProgressBar = styled.div<{
    $rewards?: number;
    $unstaking?: number;
    $total?: number;
    $isPendingUnstakeShown?: boolean;
}>`
    height: 6px;
    width: 100%;
    background: ${({ theme, $total }) =>
        $total
            ? theme.backgroundSurfaceElevationNegative
            : theme.backgroundNeutralSubtleOnElevation1};
    border-radius: 6px;
    position: relative;
    overflow: hidden;

    &::after {
        content: '';
        display: ${({ $rewards = 0 }) => ($rewards ? 'block' : 'none')};
        min-width: 1%;
        max-width: 100%;
        width: ${({ $total = 0, $rewards = 0 }) => ($rewards * 100) / $total}%;
        background: ${({ theme }) => theme.backgroundPrimaryDefault};
        border-radius: ${({ $isPendingUnstakeShown }) =>
            $isPendingUnstakeShown ? '6px 0 0 6px' : '6px'};
        height: 6px;
        position: absolute;
        right: ${({ $total = 0, $unstaking = 0, $isPendingUnstakeShown }) =>
            $isPendingUnstakeShown ? `${($unstaking * 100) / $total}%` : 0};
        top: 0;
        box-shadow: -2px 0 0 0 ${({ theme }) => theme.backgroundSurfaceElevation1};
    }

    &::before {
        content: '';
        display: ${({ $isPendingUnstakeShown }) => ($isPendingUnstakeShown ? 'block' : 'none')};
        min-width: 1%;
        max-width: 100%;
        width: ${({ $total = 0, $unstaking = 0 }) => ($unstaking * 100) / $total}%;
        background: ${({ theme }) => theme.backgroundNeutralSubdued};
        border-radius: 6px;
        height: 6px;
        position: absolute;
        right: 0;
        top: 0;
        box-shadow: -2px 0 0 0 ${({ theme }) => theme.backgroundSurfaceElevation1};
        z-index: 2;
    }
`;
