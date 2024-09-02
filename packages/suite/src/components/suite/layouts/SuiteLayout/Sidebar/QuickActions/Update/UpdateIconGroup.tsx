import { spacingsPx } from '@trezor/theme';
import styled, { css } from 'styled-components';
import { mapVariantToIconBackground, UpdateVariant } from './updateQuickActionTypes';

type UpdateIconGroupProps = {
    $variant?: UpdateVariant;
};

export const UpdateIconGroup = styled.div<UpdateIconGroupProps>`
    display: flex;
    gap: ${spacingsPx.xxs};

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
