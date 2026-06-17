import styled, { type DefaultTheme } from 'styled-components';

import { type UIVariant } from '@trezor/components/src/config/types';
import { borders, spacingsPx, typography } from '@trezor/theme';

export const tagVariants = ['primary', 'tertiary'] as const;
export type TagVariant = Extract<UIVariant, (typeof tagVariants)[number]>;

interface CheckableTagProps {
    $variant: 'primary' | 'tertiary';
}

const getCheckableTagStyles = (
    theme: DefaultTheme,
    type: CheckableTagProps['$variant'] | 'hover',
) => {
    switch (type) {
        case 'primary':
            return `
                background: ${theme.elementFillBrandSofter};
                color: ${theme.contentBrand};
                border: 1px solid ${theme.borderBrand};
        `;
        case 'hover':
            return `
                background: ${theme.elementFillElevatedHovered};
                color: ${theme.contentPrimary};
                border: 1px solid ${theme.elementBorderNeutralSofter};
            `;
        default:
            return `
                background: ${theme.elementFillElevated};
                color: ${theme.contentSecondary};
                border: 1px solid ${theme.elementFillElevated};
            `;
    }
};

export const CheckableTag = styled.button<CheckableTagProps>`
    cursor: pointer;
    border: 0;
    ${typography['body-sm']};
    padding: ${spacingsPx.xxs} ${spacingsPx.sm};
    border-radius: ${borders.radii.full};

    ${({ theme, $variant }) => getCheckableTagStyles(theme, $variant)}

    &:hover {
        ${({ theme, $variant }) =>
            getCheckableTagStyles(theme, $variant === 'primary' ? 'primary' : 'hover')}
    }
`;
