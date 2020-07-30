import { FeedbackState, InputState } from '../support/types';
import colors from '../config/colors';

const getFeedbackColor = (state: FeedbackState) => {
    switch (state) {
        case 'error':
            return colors.RED;
        case 'info':
            return colors.BLUE;
        case 'warning':
            return colors.YELLOW;
        default:
            return colors.GREEN;
    }
};

const getStateColor = (state: InputState | undefined) => {
    switch (state) {
        case 'success':
            return colors.NEUE_BG_GREEN;
        case 'warning':
            return colors.NEUE_TYPE_ORANGE;
        case 'error':
            return colors.NEUE_TYPE_RED;
        default:
            return colors.NEUE_TYPE_DARK_GREY;
    }
};

export { getStateColor, getFeedbackColor };
