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
            return colors.GREENER;
        case 'warning':
            return colors.YELLOWER;
        case 'error':
            return colors.RED;
        default:
            return colors.NEUE_TYPE_DARK_GREY;
    }
};

export { getStateColor, getFeedbackColor };
