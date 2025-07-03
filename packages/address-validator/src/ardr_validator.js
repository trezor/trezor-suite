const { addressType } = require('./crypto/utils');
const ardorRegex = new RegExp('^ARDOR(-[A-Z0-9]{4}){3}(-[A-Z0-9]{5})$');

module.exports = {
    isValidAddress (address, currency, networkType) {
        if (!ardorRegex.test(address)) {
            return false;
        }

        return true;
    },

    getAddressType (address, currency, networkType) {
        if (this.isValidAddress(address, currency, networkType)) {
            return addressType.ADDRESS;
        }

        return undefined;
    },
};
