import TrezorConnect from '@trezor/connect';

const wrappedMethods = [
    'getFeatures',
    'getDeviceState',
    'getAddress',
    'ethereumGetAddress',
    'rippleGetAddress',
    'cardanoGetAddress',
    'applySettings',
    'changePin',
    'pushTransaction',
    'ethereumSignTransaction',
    'signTransaction',
    'rippleSignTransaction',
    'cardanoSignTransaction',
    'backupDevice',
    'recoveryDevice',
] as const;

export const lockDeviceConnectPatch = ({
    onDeviceLock,
    onDeviceUnlock,
}: {
    onDeviceLock: () => void;
    onDeviceUnlock: () => void;
}) => {
    wrappedMethods.forEach(key => {
        // typescript complains about params and return type, need to be "any"
        const original: any = TrezorConnect[key];
        if (!original) return;
        (TrezorConnect[key] as any) = async (params: any) => {
            onDeviceLock();
            const result = await original(params);
            onDeviceUnlock();
            return result;
        };
    });
};
