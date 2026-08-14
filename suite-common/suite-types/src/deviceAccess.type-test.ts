import { type RequestDeviceAccess } from './deviceAccess';

declare const requestDeviceAccess: RequestDeviceAccess;

const readFeatures = async () => {
    const result = await requestDeviceAccess(() => Promise.resolve({ label: 'My Trezor' }));

    // The payload of a granted request is what the callback returned, awaited.
    if (result.success) {
        const _label: string = result.payload.label;
        void _label;

        // @ts-expect-error the payload is not widened to any
        const _wrongPayloadType: number = result.payload.label;
        void _wrongPayloadType;

        // @ts-expect-error a granted request carries no error
        void result.error;
    } else {
        const _error: string = result.error;
        const _wasSkipped: boolean = result.wasSkipped;
        void _error;
        void _wasSkipped;

        // @ts-expect-error a refused request carries no payload
        void result.payload;
    }
};
void readFeatures;

const readSynchronousCallbackResult = async () => {
    const result = await requestDeviceAccess(() => 'features');

    // @ts-expect-error a callback that does not return a promise keeps its payload type
    const _wrongPayloadType: number = result.success ? result.payload : 0;
    void _wrongPayloadType;

    const _payload: string | undefined = result.success ? result.payload : undefined;
    void _payload;
};
void readSynchronousCallbackResult;

const readWithPriority = async () => {
    const skippable = await requestDeviceAccess(() => Promise.resolve(1), {
        priority: 'skipIfBusy',
    });
    void skippable;

    // @ts-expect-error only the declared priorities are accepted
    await requestDeviceAccess(() => Promise.resolve(1), { priority: 'whenever' });
};
void readWithPriority;
