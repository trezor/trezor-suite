import colors from '../config/colors';
import { FeedbackType, ButtonVariant } from '../support/types';

const getPrimaryColor = (type?: FeedbackType) => {
    let color;
    switch (type) {
        case 'info':
            color = colors.INFO_PRIMARY;
            break;
        case 'error':
            color = colors.ERROR_PRIMARY;
            break;
        case 'warning':
            color = colors.WARNING_PRIMARY;
            break;
        case 'success':
            color = colors.SUCCESS_PRIMARY;
            break;
        default:
            color = null;
    }

    return color;
};

const getPrimaryColorBtn = (type?: ButtonVariant) => {
    let color;
    switch (type) {
        case 'info':
            color = colors.INFO_PRIMARY;
            break;
        case 'error':
            color = colors.ERROR_PRIMARY;
            break;
        case 'warning':
            color = colors.WARNING_PRIMARY;
            break;
        case 'success':
            color = colors.SUCCESS_PRIMARY;
            break;
        case 'white':
            color = colors.INFO_PRIMARY;
            break;
        default:
            color = null;
    }

    return color;
};

const getSecondaryColor = (type?: FeedbackType) => {
    let color;
    switch (type) {
        case 'info':
            color = colors.INFO_SECONDARY;
            break;
        case 'error':
            color = colors.ERROR_SECONDARY;
            break;
        case 'warning':
            color = colors.WARNING_SECONDARY;
            break;
        case 'success':
            color = colors.SUCCESS_SECONDARY;
            break;
        default:
            color = null;
    }

    return color;
};

const getSecondaryColorBtn = (type?: ButtonVariant) => {
    let color;
    switch (type) {
        case 'info':
            color = colors.INFO_SECONDARY;
            break;
        case 'error':
            color = colors.ERROR_SECONDARY;
            break;
        case 'warning':
            color = colors.WARNING_SECONDARY;
            break;
        case 'success':
            color = colors.SUCCESS_SECONDARY;
            break;
        case 'white':
            color = colors.WHITE;
            break;
        default:
            color = null;
    }

    return color;
};

const getNotificationBgColor = (type?: FeedbackType) => {
    let color;
    switch (type) {
        case 'info':
            color = colors.INFO_LIGHT;
            break;
        case 'error':
            color = colors.ERROR_LIGHT;
            break;
        case 'warning':
            color = colors.WARNING_LIGHT;
            break;
        case 'success':
            color = colors.SUCCESS_LIGHT;
            break;
        default:
            color = null;
    }

    return color;
};

export {
    getPrimaryColor,
    getPrimaryColorBtn,
    getSecondaryColor,
    getSecondaryColorBtn,
    getNotificationBgColor,
};
