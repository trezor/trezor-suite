export class NodeUsbTransport {
    init() {
        return {
            success: false,
            message: 'NodeUsbTransport can not be used in browser environment',
        };
    }
}
