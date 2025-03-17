import { DefaultTheme, css } from 'styled-components';

type InputColorOptions = {
    checked?: boolean;
    disabled?: boolean;
};

type LabelColorOptions = {
    disabled?: boolean;
    alert?: boolean;
};

export const getInputColor = (theme: DefaultTheme, { checked, disabled }: InputColorOptions) => {
    if (checked) {
        return disabled
            ? theme.stateFillElementBrandBoldActiveDisabled
            : theme.stateFillElementBrandBoldActive;
    }

    return disabled ? theme.stateFillElementBoldDisabled : theme.baseFillElementNeutralBold;
};

export const getLabelColor = (theme: DefaultTheme, { alert, disabled }: LabelColorOptions) => {
    if (alert) {
        return theme.borderAlertRed;
    }

    return disabled ? theme.textDisabled : theme.textDefault;
};

export const focusStyleTransition = 'box-shadow 0.1s ease-out, border-color 0.1s ease-out';

export const getFocusShadowStyle = (selector = '&:focus-visible') => css`
    ${selector} {
        border-color: ${({ theme }) => theme.backgroundAlertBlueBold};
        box-shadow: ${({ theme }) => theme.boxShadowFocused};
    }
`;
