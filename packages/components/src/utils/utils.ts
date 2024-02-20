import { css, DefaultTheme } from 'styled-components';

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
        border-color: ${({ theme }) => theme.backgroundAlertBlueBold};
        box-shadow: ${({ theme }) => theme.boxShadowFocused};
    }
`;
