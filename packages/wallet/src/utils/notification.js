import { colors, icons } from 'trezor-ui-components';

const getPrimaryColor = type => {
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

const getNotificationBgColor = type => {
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

const getIcon = type => icons[type.toUpperCase()];

export { getPrimaryColor, getNotificationBgColor, getIcon };
