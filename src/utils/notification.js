import colors from 'config/colors';
import icons from 'config/icons';

const getColor = (type) => {
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

const getIcon = type => icons[type.toUpperCase()];

export {
    getColor,
    getIcon,
};