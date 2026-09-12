// The real "usb" dependency causes memory leaks in unit tests: it sets event listeners on the top
// level (see: node_modules/usb/dist/index.js). Unit tests that initialize Connect construct
// NodeUsbTransport, which is one of the node default transports, so this stub has to be
// constructible and behave like a host with no Trezor attached.
export class WebUSB {
    onconnect = null;

    ondisconnect = null;

    getDevices() {
        return Promise.resolve([]);
    }

    requestDevice() {
        return Promise.reject(new Error('usb is mocked in unit tests'));
    }
}
