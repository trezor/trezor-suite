import colors from '../config/colors';

type Props = 'info' | 'error' | 'warning' | 'success';

const getPrimaryColor = (type?: Props) => {
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
            color = colors.SUCCESS_PRIMARY;
    }

    return color;
};

const getSecondaryColor = (type?: Props) => {
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
            color = colors.SUCCESS_SECONDARY;
    }

    return color;
};

const getNotificationBgColor = (type?: Props) => {
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
            color = colors.SUCCESS_LIGHT;
    }

    return color;
};

export { getPrimaryColor, getSecondaryColor, getNotificationBgColor };
