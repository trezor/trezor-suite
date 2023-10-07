import { css, DefaultTheme } from 'styled-components';
import { boxShadows } from '@trezor/theme';
import { MEDIA_QUERY } from '../config/variables';

type InputColorOptions = {
    checked?: boolean;
    disabled?: boolean;
};

type LabelColorOptions = {
    disabled?: boolean;
    alert?: boolean;
};

export const getInputColor = (theme: DefaultTheme, { checked, disabled }: InputColorOptions) => {
    if (!checked) {
        return theme.backgroundNeutralDisabled;
    }
    return disabled ? theme.backgroundPrimarySubtleOnElevation0 : theme.backgroundPrimaryDefault;
};

export const getLabelColor = (theme: DefaultTheme, { alert, disabled }: LabelColorOptions) => {
    if (alert) {
        return theme.borderAlertRed;
    }
    return disabled ? theme.textDisabled : theme.textDefault;
};

export const focusStyleTransition = 'box-shadow 0.1s ease-out, border-color 0.1s ease-out';

export const getFocusShadowStyle = (selector = ':focus-visible') => css`
    ${selector} {
        border: ${({ theme }) => `1px solid ${theme.backgroundAlertBlueBold}`};
        box-shadow: ${boxShadows.focusedLight};
    }

    ${MEDIA_QUERY.DARK_THEME} {
        ${selector} {
            box-shadow: ${boxShadows.focusedDark};
        }
    }
`;
