import colors from 'config/colors';

const getStatus = (device) => {
    let status = 'connected';
    if (device.features && device.features.bootloader_mode) {
        status = 'connected-bootloader';
    } else if (!device.connected) {
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
    let statusName;
    switch (deviceStatus) {
        case 'used-in-other-window':
            statusName = 'Used in other window';
            break;
        case 'connected':
            statusName = 'Connected';
            break;
        case 'connected-bootloader':
            statusName = 'Connected (bootloader mode)';
            break;
        case 'disconnected':
            statusName = 'Disconnected';
            break;
        case 'unacquired':
            statusName = 'Used in other window';
            break;
        case 'unavailable':
            statusName = 'Unavailable';
            break;
        default:
            statusName = 'Status unknown';
    }
    return statusName;
};

const isWebUSB = transport => !!((transport && transport.version.indexOf('webusb') >= 0));

const isDisabled = (selectedDevice, devices, transport) => {
    if (isWebUSB(transport)) return false; // always enabled if webusb
    if (devices.length < 1) return true; // no devices
    if (devices.length === 1) {
        if (!selectedDevice.features) return true; // unacquired, unreadable
        if (selectedDevice.features.bootloader_mode || !selectedDevice.features.initialized) return true; // bootlader, not initialized
    }
    return false; // default
};

const getVersion = (device) => {
    let version;
    if (device.features && device.features.major_version > 1) {
        version = 'T';
    } else {
        version = '1';
    }
    return version;
};

const getStatusColor = (deviceStatus) => {
    let color;
    switch (deviceStatus) {
        case 'used-in-other-window':
            color = colors.WARNING_PRIMARY;
            break;
        case 'connected':
            color = colors.GREEN_PRIMARY;
            break;
        case 'connected-bootloader':
            color = colors.WARNING_PRIMARY;
            break;
        case 'unacquired':
            color = colors.WARNING_PRIMARY;
            break;
        case 'disconnected':
            color = colors.ERROR_PRIMARY;
            break;
        case 'unavailable':
            color = colors.ERROR_PRIMARY;
            break;
        default:
            color = colors.TEXT_PRIMARY;
    }
    return color;
};

export {
    isWebUSB,
    getStatus,
    isDisabled,
    getStatusName,
    getVersion,
    getStatusColor,
};