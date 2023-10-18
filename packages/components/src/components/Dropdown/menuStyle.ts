import { css, keyframes } from 'styled-components';
import { spacingsPx, borders, boxShadows, typography, zIndices } from '@trezor/theme';

export const DROPDOWN_MENU = keyframes`
    0% {
        opacity: 0;
        transform: translateY(-12px);
    }

    100% {
        opacity: 1;
        transform: translateY(0);
    }
`;

export const menuStyle = css`
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: ${spacingsPx.sm};
    min-width: 140px;
    border-radius: ${borders.radii.md};
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    box-shadow: ${boxShadows.elevation3};
    z-index: ${zIndices.modal};
    animation: ${DROPDOWN_MENU} 0.15s ease-in-out;
    list-style-type: none;
    overflow: hidden;
    /* when theme changes from light to dark */
    transition: background 0.3s;
    ${typography.hint}
`;
