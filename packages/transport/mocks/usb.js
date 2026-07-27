// "usb" dependency causes memory leaks in unit tests
// it sets event listeners on the top level (see: node_modules/usb/dist/index.js)
export class WebUSB {
    constructor() {
        throw new Error('usb not available');
    }
}
