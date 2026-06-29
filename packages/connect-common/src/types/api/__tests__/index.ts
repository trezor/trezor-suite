// TrezorConnect API types tests

import type {
    TrezorConnectPrivilegedAPI as TrezorConnect,
    // Exported types // TODO: breaking change missing ex: EthereumAddress
} from '../../..';

export const init = async (api: TrezorConnect) => {
    const settings = await api.getSettings();
    if (settings.success) {
        const { payload } = settings;
        payload.manifest?.appUrl.toLowerCase();
        if (payload.debug === true) {
            // empty
        }
    }

    api.dispose();
    // callId must be a UUID v4 (validated when the method is invoked via AbstractMethod).
    const exampleCallId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    api.cancel();
    api.cancel({ reason: 'Interruption error' });
    api.cancel({ callId: exampleCallId });
    api.cancel({ reason: 'Interruption error', callId: exampleCallId });
    // Backward-compatible string form (legacy API).
    api.cancel('Interruption error');
};
