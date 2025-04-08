import TrezorConnect, { UI_EVENT } from '@trezor/connect';

/**
 * TrezorConnectService
 *
 * A service that provides a wrapper around TrezorConnect to make it easier to test
 * and to provide a consistent interface for interacting with TrezorConnect.
 *
 * This service allows you to call TrezorConnect methods and provides a way to mock
 * those calls in tests.
 */
export const createTrezorConnectService = (trezorImplementation: typeof TrezorConnect) => {
    const _awaitConnectUIAction = () =>
        Promise.race([
            new Promise<void>(resolve => {
                const listener = () => {
                    resolve();
                    trezorImplementation.off(UI_EVENT, listener);
                };

                trezorImplementation.on(UI_EVENT, listener);
            }),
            new Promise<void>(resolve => setTimeout(resolve, 1000)),
        ]);

    /**
     * Call a TrezorConnect method
     * @param fn Function to call with TrezorConnect as the argument
     * @returns The result of the function call
     */
    const invoke = <R>(fn: (trezorConnect: typeof TrezorConnect) => R): R =>
        fn(trezorImplementation);

    /**
     * Call a TrezorConnect method that requires a UI action - it returns a promise that resolves when the UI action is completed (Device is prepare for the UI response)
     * @param fn Function to call with TrezorConnect as the argument
     * @returns An object containing the UI promise and the response promise
     */
    const invokeUIAction = <R>(
        fn: (trezorConnect: typeof TrezorConnect) => R,
    ): { deviceReadyPromise: Promise<void>; responsePromise: R } => {
        const deviceReadyPromise = _awaitConnectUIAction();
        const responsePromise = fn(trezorImplementation);

        return { deviceReadyPromise, responsePromise };
    };

    return {
        invoke,
        invokeUIAction,
    };
};

export type TrezorConnectService = ReturnType<typeof createTrezorConnectService>;
