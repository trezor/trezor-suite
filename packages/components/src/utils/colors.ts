import { InputState, SuiteThemeColors } from '../support/types';

const getStateColor = (state: InputState | undefined, theme: SuiteThemeColors) => {
    switch (state) {
        case 'success':
            return theme.BG_GREEN;
        case 'warning':
            return theme.TYPE_ORANGE;
        case 'error':
            return theme.TYPE_RED;
        default:
            return theme.TYPE_DARK_GREY;
    }
};

export { getStateColor };
