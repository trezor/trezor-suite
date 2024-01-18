import { Icon } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import styled, { css } from 'styled-components';

export const ArrowIcon = styled(Icon)`
    transition: opacity 0.1s;
    margin: ${spacingsPx.xs};
`;

export const styledHoverOnParentOfArrowIcon = css`
    :hover {
        ${ArrowIcon} {
            path {
                fill: ${({ theme }) => theme.iconPrimaryDefault};
            }
        }
    }
`;
