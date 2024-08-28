import { Color, CSSColor, spacingsPx } from '@trezor/theme';
import styled, { css, DefaultTheme } from 'styled-components';
import { UIVariant } from '@trezor/components/src/config/types';

export const updateIconGroupVariants = ['tertiary', 'info', 'purple'] as const;
export type UpdateIconGroupVariant =
    | Extract<UIVariant, (typeof updateIconGroupVariants)[number]>
    | 'purple';

type UpdateIconGroupProps = {
    $variant?: UpdateIconGroupVariant;
};

type MapArgs = {
    $variant: UpdateIconGroupVariant;
    theme: DefaultTheme;
};

export const mapVariantToIconBackground = ({ $variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<UpdateIconGroupVariant, Color> = {
        purple: 'backgroundAlertPurpleSubtleOnElevationNegative',
        tertiary: 'transparent',
        info: 'backgroundAlertBlueSubtleOnElevationNegative',
    };

    return theme[colorMap[$variant]];
};

export const UpdateIconGroup = styled.div<UpdateIconGroupProps>`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${spacingsPx.xxs} ${spacingsPx.xxs};
    margin: -${spacingsPx.xxs};

    background-color: ${({ $variant, theme }) =>
        $variant && mapVariantToIconBackground({ $variant, theme })};

    border-radius: 6px;

    ${({ $variant, theme }) =>
        $variant === 'tertiary'
            ? css`
                  border: 1.5px solid ${theme['borderElevationNegative']};
              `
            : ''};
`;
