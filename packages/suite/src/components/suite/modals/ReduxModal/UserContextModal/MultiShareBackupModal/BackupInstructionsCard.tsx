import { ReactNode } from 'react';
import styled, { css } from 'styled-components';

import { Card, IconLegacy, IconType } from '@trezor/components';
import { borders, spacingsPx } from '@trezor/theme';

const StyledCard = styled(Card)<{ $isHorizontal: boolean }>`
    align-items: center;
    gap: ${spacingsPx.md};

    ${({ $isHorizontal }) =>
        $isHorizontal
            ? css`
                  flex-direction: row;
              `
            : css`
                  text-align: center;
              `}
`;

const StyledIcon = styled(IconLegacy)<{ $isCircled: boolean }>`
    ${({ $isCircled }) =>
        $isCircled &&
        css`
            border: ${borders.widths.large} solid ${({ theme }) => theme.iconDefault};
            border-radius: ${borders.radii.full};
            padding: ${spacingsPx.xl};
        `}
`;

interface BackupInstructionsCardProps {
    children: ReactNode;
    icon: IconType;
    isHorizontal?: boolean;
}

export const BackupInstructionsCard = ({
    children,
    icon,
    isHorizontal,
}: BackupInstructionsCardProps) => (
    <StyledCard $isHorizontal={!!isHorizontal}>
        <StyledIcon icon={icon} size={32} $isCircled={!isHorizontal} />
        {children}
    </StyledCard>
);
