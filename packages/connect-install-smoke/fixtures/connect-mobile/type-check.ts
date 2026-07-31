import TrezorConnectMobile, {
    DEVICE_EVENT,
    TrezorConnectDeeplink,
    type Manifest,
} from '@trezor/connect-mobile';

type InitParams = Parameters<typeof TrezorConnectMobile.init>[0];
type DeeplinkCtorParams = ConstructorParameters<typeof TrezorConnectDeeplink>;

const _connectMobile: typeof TrezorConnectMobile = TrezorConnectMobile;
const _deviceEvent: typeof DEVICE_EVENT = DEVICE_EVENT;
const _DeeplinkClass: typeof TrezorConnectDeeplink = TrezorConnectDeeplink;

export type { DeeplinkCtorParams, InitParams, Manifest };
export { _DeeplinkClass, _connectMobile, _deviceEvent };
