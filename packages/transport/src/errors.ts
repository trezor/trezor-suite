// this file contains all PUBLIC errors

export const INTERFACE_UNABLE_TO_OPEN_DEVICE = 'Unable to open device' as const;
export const INTERFACE_UNABLE_TO_CLOSE_DEVICE = 'Unable to close device' as const;
/**
 * An error occured during data transfer.
 * If user disconnects device DEVICE_DISCONNECTED_DURING_ACTION should be returned
 *
 * transports: webusb
 */
export const INTERFACE_DATA_TRANSFER = 'A transfer error has occurred.' as const;
/**
 * for given path device does not exist
 *
 * transports: bridge, webusb
 *
 * bridge: https://github.dev/trezor/trezord-go/blob/8f35971d3c36ea8b91ff54810397526ef8e741c5/usb/bus.go#L56
 *
 */
export const DEVICE_NOT_FOUND = 'device not found' as const;
/**
 * device was enumerated but we can't read/write it
 *
 * transports: webusb
 */
export const DEVICE_UNREADABLE = 'Device unreadable' as const;
/**
 * in acquire call, trying to acquire path with wrong previous session
 *
 * transports: bridge, webusb
 *
 * bridge: https://github.dev/trezor/trezord-go/blob/8f35971d3c36ea8b91ff54810397526ef8e741c5/core/core.go#L138
 */
export const SESSION_WRONG_PREVIOUS = 'wrong previous session' as const;
/**
 * operation on a session that does not exist
 *
 * transports: bridge, webusb
 *
 * bridge: https://github.dev/trezor/trezord-go/blob/8f35971d3c36ea8b91ff54810397526ef8e741c5/core/core.go#L138
 */
export const SESSION_NOT_FOUND = 'session not found' as const;
/**
 * sessions background did not respond in time
 *
 * transports: webusb
 */
export const SESSION_BACKGROUND_TIMEOUT = 'sessions background did not respond' as const;
/**
 * in case transport.listen is called for another time. implementators error.
 *
 * transports: webusb
 */
export const ALREADY_LISTENING = 'already listening' as const;
/**
 * attempt to use specific transport class in a wrong environment. implementators error.
 *
 * transports: webusb
 */
export const NATIVE_INTERFACE_NOT_AVAILABLE = 'interface not available' as const;
/**
 * bridge returned unexpected shape of response for selected call.
 *
 * this error should be removed in the future
 */
export const WRONG_RESULT_TYPE = 'Wrong result type.' as const;
export const WRONG_ENVIRONMENT = 'This transport can not be used in this environment' as const;
/**
 * self-explanatory
 *
 * transports: bridge, webusb
 *
 * bridge: https://github.dev/trezor/trezord-go/blob/8f35971d3c36ea8b91ff54810397526ef8e741c5/usb/bus.go#L56
 */
export const DEVICE_DISCONNECTED_DURING_ACTION = 'device disconnected during action' as const;
export const OTHER_CALL_IN_PROGRESS = 'other call in progress' as const;
// bridge
export const HTTP_ERROR = 'Network request failed' as const;
/**
 * COMMON ERRORS
 */
export const UNEXPECTED_ERROR = 'unexpected error' as const;
/**
 * see scheduleAction
 */
export const ABORTED_BY_SIGNAL = 'Aborted by signal' as const;
/**
 * see scheduleAction
 */
export const ABORTED_BY_TIMEOUT = 'Aborted by timeout' as const;
