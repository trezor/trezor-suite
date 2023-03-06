import { DefaultTheme } from 'styled-components';
import { darken } from 'polished';

type Options = {
    checked?: boolean;
    disabled?: boolean;
};

export const getInputColor = (theme: DefaultTheme, { checked, disabled }: Options) => {
    if (!checked) {
        return theme.STROKE_GREY;
    }
    return disabled ? darken(theme.DARKEN_20_PERCENT_FILTER, theme.STROKE_GREY) : theme.BG_GREEN;
};
