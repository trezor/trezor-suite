import styled from 'styled-components';
import { Card, Paragraph, variables } from '@trezor/components';
import { borders, spacingsPx } from '@trezor/theme';

export const StyledCard = styled(Card)`
    padding: ${spacingsPx.sm};
`;

export const CardBottomContent = styled.div`
    margin-top: ${spacingsPx.lg};
`;

export const AccentP = styled(Paragraph)`
    color: ${({ theme }) => theme.textDefault};
    font-size: ${variables.FONT_SIZE.H2};
`;

export const GreyP = styled(Paragraph)`
    color: ${({ theme }) => theme.textSubdued};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

export const InfoBox = styled.div`
    margin: -10px -10px ${spacingsPx.md} -10px;
    padding: 6px;
    border: 1px solid ${({ theme }) => theme.borderOnElevation1};
    border-radius: ${borders.radii.md};
    position: relative;

    &::after {
        content: '';
        display: block;
        position: absolute;
        bottom: -6px;
        left: 12px;
        background-color: ${({ theme }) => theme.backgroundSurfaceElevation1};
        height: 14px;
        width: 16px;
        clip-path: polygon(100% 50%, 0 50%, 50% 100%);
    }

    &::before {
        content: '';
        display: block;
        position: absolute;
        bottom: -7px;
        left: 12px;
        background-color: ${({ theme }) => theme.borderOnElevation1};
        height: 14px;
        width: 16px;
        clip-path: polygon(100% 50%, 0 50%, 50% 100%);
    }
`;

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
