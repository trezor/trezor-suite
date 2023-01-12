export class WebUsbTransport {
    init() {
        return Promise.resolve({
            success: false,
            // todo: maybe ERRORS?
            message: 'WebUsbTransport can not be used in node environment',
        });
    }
}
