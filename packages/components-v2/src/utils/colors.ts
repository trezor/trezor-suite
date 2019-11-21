import { FeedbackType } from '../support/types';
import colors from '../config/colors';

const getFeedbackColor = (state: FeedbackType) => {
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

export { getFeedbackColor };
