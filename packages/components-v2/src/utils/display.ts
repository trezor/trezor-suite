import { InputDisplay } from '../support/types';

export const getDisplayWidth = (display: InputDisplay) => {
    switch (display) {
        case 'block':
            return '100%';
        case 'short':
            return '160px';
        default:
            return '480px';
    }
};
