import { ReactNativeUsbModule } from './ReactNativeUsbModule';

import { WebUSB } from './index';

// `index.ts` imports `ReactNativeUsbModule`, which calls `requireNativeModule()` at module load
// time and would throw outside a native runtime. Mock it so we can exercise the pure JS `WebUSB`
// event-handler logic. `addListener` returns a subscription with a `remove` spy so tests can
// assert which subscription gets removed.
jest.mock('./ReactNativeUsbModule', () => ({
    ReactNativeUsbModule: {
        addListener: jest.fn(),
    },
}));

const addListener = ReactNativeUsbModule.addListener as jest.Mock;

const mockSubscription = () => ({ remove: jest.fn() });

describe('WebUSB onconnect/ondisconnect event-handler setters', () => {
    beforeEach(() => {
        addListener.mockReset();
        addListener.mockImplementation(mockSubscription);
    });

    it('registers a single native subscription when a handler is assigned', () => {
        const usb = new WebUSB();

        usb.onconnect = jest.fn();

        expect(addListener).toHaveBeenCalledTimes(1);
        expect(addListener).toHaveBeenCalledWith('onDeviceConnect', expect.any(Function));
    });

    it('removes the previous subscription when the handler is overwritten', () => {
        const usb = new WebUSB();
        const firstSubscription = mockSubscription();
        addListener.mockReturnValueOnce(firstSubscription);

        usb.onconnect = jest.fn();
        usb.onconnect = jest.fn();

        // the previous native listener is removed, then a new one is registered — never stacked
        expect(firstSubscription.remove).toHaveBeenCalledTimes(1);
        expect(addListener).toHaveBeenCalledTimes(2);
    });

    it('removes the subscription and registers nothing when set to null', () => {
        const usb = new WebUSB();
        const subscription = mockSubscription();
        addListener.mockReturnValueOnce(subscription);

        usb.onconnect = jest.fn();
        usb.onconnect = null;

        expect(subscription.remove).toHaveBeenCalledTimes(1);
        // Regression guard: the pre-fix setter ignored null and called the native registration
        // anyway, leaking a listener whose body later crashed on `null(event)`. A null assignment
        // must detach only — no new subscription.
        expect(addListener).toHaveBeenCalledTimes(1);
    });

    it('manages ondisconnect independently from onconnect', () => {
        const usb = new WebUSB();
        const connectSubscription = mockSubscription();
        const disconnectSubscription = mockSubscription();
        addListener
            .mockReturnValueOnce(connectSubscription)
            .mockReturnValueOnce(disconnectSubscription);

        usb.onconnect = jest.fn();
        usb.ondisconnect = jest.fn();

        expect(addListener).toHaveBeenNthCalledWith(1, 'onDeviceConnect', expect.any(Function));
        expect(addListener).toHaveBeenNthCalledWith(2, 'onDeviceDisconnect', expect.any(Function));

        usb.ondisconnect = null;

        expect(disconnectSubscription.remove).toHaveBeenCalledTimes(1);
        expect(connectSubscription.remove).not.toHaveBeenCalled();
    });
});
