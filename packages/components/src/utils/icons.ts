import { FeedbackType } from '../support/types';

const getStateIcon = (type?: FeedbackType) => {
    let icon = null;
    switch (type) {
        case 'info':
            icon = 'INFO';
            break;
        case 'error':
            icon = 'ERROR';
            break;
        case 'warning':
            icon = 'WARNING';
            break;
        case 'success':
            icon = 'SUCCESS';
            break;
        default:
            icon = null;
    }
    return icon;
};

export { getStateIcon };
