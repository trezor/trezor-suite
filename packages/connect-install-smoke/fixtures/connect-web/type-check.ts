import TrezorConnectWeb, {
    DEVICE_EVENT,
    type AuthenticateDeviceParams,
    type AuthenticateDeviceResult,
} from '@trezor/connect-web';

type InitParams = Parameters<typeof TrezorConnectWeb.init>[0];

const _connectWeb: typeof TrezorConnectWeb = TrezorConnectWeb;
const _deviceEvent: typeof DEVICE_EVENT = DEVICE_EVENT;

export type { AuthenticateDeviceParams, AuthenticateDeviceResult, InitParams };
export { _connectWeb, _deviceEvent };
