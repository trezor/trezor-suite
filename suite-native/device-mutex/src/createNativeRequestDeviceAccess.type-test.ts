import { createNativeRequestDeviceAccess } from './createNativeRequestDeviceAccess';

const readFeatures = async () => {
    const requestDeviceAccess = createNativeRequestDeviceAccess();
    const result = await requestDeviceAccess(() => Promise.resolve({ label: 'My Trezor' }));

    // The callback's payload survives both the mutex and the factory.
    const _label: string | undefined = result.success ? result.payload.label : undefined;
    void _label;

    // @ts-expect-error the payload is not widened to any
    void (result.success ? result.payload.unknownProperty : undefined);
};
void readFeatures;
