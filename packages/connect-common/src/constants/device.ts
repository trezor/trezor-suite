// device list events
export const CONNECT = 'device-connect';
export const CONNECT_UNACQUIRED = 'device-connect_unacquired';
export const DISCONNECT = 'device-disconnect';
export const CHANGED = 'device-changed';
export const ACQUIRE = 'device-acquire';
export const RELEASE = 'device-release';
export const ACQUIRED = 'device-acquired';
export const RELEASED = 'device-released';
export const USED_ELSEWHERE = 'device-used_elsewhere';

export const LOADING = 'device-loading';

// trezor-link events in protobuf format
export const BUTTON = 'button';
export const PIN = 'pin';
export const PASSPHRASE = 'passphrase';
export const PASSPHRASE_ON_DEVICE = 'passphrase_on_device';
export const WORD = 'word';

// custom
// todo: is it used?
export const WAIT_FOR_SELECTION = 'device-wait_for_selection';
