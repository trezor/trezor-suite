import colors from 'config/colors';
import icons from 'config/icons';

const getPrimaryColor = (type) => {
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

const getSecondaryColor = (type) => {
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

const getIcon = type => icons[type.toUpperCase()];

export {
    getPrimaryColor,
    getSecondaryColor,
    getIcon,
};