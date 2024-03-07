import React, { ReactNode } from 'react';
import styled, { useTheme } from 'styled-components';
import { Icon } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';

interface BannerPointsProps {
    points: ReactNode[];
}

const Point = styled.div`
    display: flex;
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
    gap: ${spacingsPx.md};

    & + & {
        margin-top: ${spacingsPx.xs};
    }
`;

export const BannerPoints = ({ points }: BannerPointsProps) => {
    const theme = useTheme();
    if (points.length === 0) return null;

    return (
        <>
            {points.map((point, i) => (
                <Point key={i}>
                    <Icon icon="CHECK" size={20} color={theme.iconPrimaryDefault} />
                    {point}
                </Point>
            ))}
        </>
    );
};
