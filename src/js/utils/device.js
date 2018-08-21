import colors from 'js/config/colors';

const getDeviceSelectStatus = (device) => {
    let status = 'connected';
    if (!device.connected) {
        status = 'disconnected';
    } else if (!device.available) {
        status = 'unavailable';
    } else if (device.type === 'acquired') {
        if (device.status === 'occupied') {
            status = 'used-in-other-window';
        }
    } else if (device.type === 'unacquired') {
        status = 'unacquired';
    }

    return status;
};

const getStatusName = (deviceStatus) => {
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

const isDisabled = (selectedDevice, devices, transport) => (devices.length < 1 && !isWebUSB(transport)) || (devices.length === 1 && !selectedDevice.features && !isWebUSB(transport));

const getVersion = (device) => {
    let version = null;
    if (device.features && device.features.major_version > 1) {
        version = 'T';
    } else {
        version = '1';
    }
    return version;
};

const getStatusColor = (deviceStatus) => {
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

    console.log('color', color);

    return color;
};

export {
    getDeviceSelectStatus,
    isDisabled,
    getStatusName,
    getVersion,
    getStatusColor,
};