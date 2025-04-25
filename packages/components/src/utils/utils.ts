import { css } from 'styled-components';

export const focusStyleTransition = 'box-shadow 0.1s ease-out, border-color 0.1s ease-out';

export const getFocusShadowStyle = (selector = '&:focus-visible') => css`
    ${selector} {
        border-color: ${({ theme }) => theme.backgroundAlertBlueBold};
        box-shadow: ${({ theme }) => theme.boxShadowFocused};
    }
`;
