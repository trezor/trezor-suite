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
    const status = getStatus(device);
    const unknownStatusName = 'Status unknown';
    let statusName;
    switch (status) {
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

const getVersion = (device) => {
    let version = null;
    if (device.features && device.features.major_version > 1) {
        version = 'T';
    } else {
        version = '1';
    }
    return version;
};

const getStatusColor = device => 'red';

export {
    getStatusName,
    getVersion,
    getStatusColor,
};