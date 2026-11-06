import type { StoredAuthenticateDeviceResult } from '../src/device';

export const mockStoredAuthenticateDeviceResult = (): StoredAuthenticateDeviceResult => ({
    valid: true,
    optigaResult: { valid: true, rootPubKey: 'root-pub-key' },
    tropicResult: null,
    mcuResult: null,
});
