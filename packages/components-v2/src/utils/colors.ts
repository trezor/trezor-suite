import colors from '../config/colors';
import { InputState } from '../support/types';

export const getStateColor = (state: InputState | undefined) => {
    switch (state) {
        case 'success':
            return colors.GREENER;
        case 'warning':
            return colors.YELLOWER;
        case 'error':
            return colors.RED;
        default:
            return colors.BLACK50;
    }
};
