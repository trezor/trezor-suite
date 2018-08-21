import colors from 'js/config/colors';

const getStatus = (device) => {
    let deviceStatus = '';
    if (device.type === 'unacquired' || (device.features && device.status === 'occupied')) {
        deviceStatus = 'used-in-other-window';
    } else if (device.type === 'unreadable') {
        deviceStatus = 'connected';
    } else if (!device.connected) {
        deviceStatus = 'disconnected';
    } else if (!device.available) {
        deviceStatus = 'unavailable';
    }

    return deviceStatus;
};

const getStatusName = (device) => {
    const deviceStatus = getStatus(device);
    const unknownStatusName = 'Status unknown';
    let statusName;
    switch (deviceStatus) {
        case 'used-in-other-window':
            statusName = 'Used in other window';
            break;
        case 'connected':
            statusName = 'Connected';
            break;
        case 'disconnected':
            statusName = 'Disconnected';
            break;
        case 'unavailable':
            statusName = 'Unavailable';
            break;
        default:
            statusName = unknownStatusName;
    }

    return statusName;
};

const isWebUSB = transport => !!((transport && transport.version.indexOf('webusb') >= 0));

const isDisabled = (devices, transport) => (devices.length < 1 && !isWebUSB(transport)) || (devices.length === 1 && !selected.features && !webusb);

const getVersion = (device) => {
    let version = null;
    if (device.features && device.features.major_version > 1) {
        version = 'T';
    } else {
        version = '1';
    }
    return version;
};

const getStatusColor = (device) => {
    const deviceStatus = getStatus(device);
    let color = null;

    switch (deviceStatus) {
        case 'used-in-other-window':
            color = colors.WARNING_PRIMARY;
            break;
        case 'connected':
            color = colors.GREEN_PRIMARY;
            break;
        case 'disconnected':
            color = colors.ERROR_PRIMARY;
            break;
        case 'unavailable':
            color = colors.ERROR_PRIMARY;
            break;
        default:
            color = colors.ERROR_PRIMARY;
    }

    return color;
};

export {
    isDisabled,
    getStatusName,
    getVersion,
    getStatusColor,
};