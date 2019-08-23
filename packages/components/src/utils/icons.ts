import { FeedbackType } from '../support/types';

type ReturnType = 'INFO' | 'ERROR' | 'WARNING' | 'SUCCESS' | null;
const getStateIcon = (type?: FeedbackType): ReturnType => {
    let icon: ReturnType = null;
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

const getDeviceIcon = (model: number): 'T1' | 'T2' => {
    if (typeof model !== 'number' || model < 2) return 'T1';
    return 'T2';
};

export { getStateIcon, getDeviceIcon };
