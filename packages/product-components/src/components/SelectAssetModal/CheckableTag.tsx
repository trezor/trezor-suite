import { UIVariant } from '@trezor/components/src/config/types';
import {
    borders,
    Elevation,
    mapElevationToBackground,
    mapElevationToBorder,
    spacingsPx,
    typography,
} from '@trezor/theme';
import styled, { DefaultTheme } from 'styled-components';

export const tagVariants = ['primary', 'tertiary'] as const;
export type TagVariant = Extract<UIVariant, (typeof tagVariants)[number]>;

interface CheckableTagProps {
    $variant: 'primary' | 'tertiary';
    $elevation: Elevation;
}

const getCheckableTagStyles = (
    $elevation: Elevation,
    theme: DefaultTheme,
    type: CheckableTagProps['$variant'] | 'hover',
) => {
    switch (type) {
        case 'primary':
            return `
                background: ${theme.backgroundPrimarySubtleOnElevation1};
                color: ${theme.textPrimaryDefault};
                border: 1px solid ${theme.borderSecondary};
        `;
        case 'hover':
            return `
                background: ${mapElevationToBackground({ $elevation, theme })};
                color: ${theme.textDefault};
                border: 1px solid ${mapElevationToBorder({ $elevation, theme })};
            `;
        default:
            return `
                background: ${mapElevationToBackground({ $elevation, theme })};
                color: ${theme.textSubdued};
                border: 1px solid ${mapElevationToBackground({ $elevation, theme })};
            `;
    }
};

export const CheckableTag = styled.button<CheckableTagProps>`
    cursor: pointer;
    border: 0;
    ${typography.hint};
    padding: ${spacingsPx.xxs} ${spacingsPx.sm};
    border-radius: ${borders.radii.full};

    ${({ $elevation, theme, $variant }) => getCheckableTagStyles($elevation, theme, $variant)}

    &:hover {
        ${({ $elevation, theme, $variant }) =>
            getCheckableTagStyles($elevation, theme, $variant === 'primary' ? 'primary' : 'hover')}
    }
`;
