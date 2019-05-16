exports.httpRequest = function httpRequest(url, type) {
    const fileUrl = url.split('?')[0];
    /* eslint-disable global-require */
    switch (fileUrl) {
        case './data/config.json':
            return require('../../../data/config.json');
        case './data/coins.json':
            return require('../../../data/coins.json');
        case './data/bridge/releases.json':
            return require('../../../data/bridge/releases.json');
        case './data/firmware/1/releases.json':
            return require('../../../data/firmware/1/releases.json');
        case './data/firmware/2/releases.json':
            return require('../../../data/firmware/2/releases.json');
        case './data/messages/messages-v6.json':
            return require('../../../data/messages/messages-v6.json');
        case './data/messages/messages.json':
            return require('../../../data/messages/messages.json');
        default:
            return null;
    }
    /* eslint-enable global-require */
};

exports.getOrigin = function getOrigin(url) {
    if (url.indexOf('file://') === 0) return 'file://'; // eslint-disable-next-line no-irregular-whitespace, no-useless-escape

    const parts = url.match(/^.+\:\/\/[^\/]+/);
    return Array.isArray(parts) && parts.length > 0 ? parts[0] : 'unknown';
};
