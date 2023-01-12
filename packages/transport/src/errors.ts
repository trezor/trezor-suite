export const ALREADY_LISTENING = '@trezor/transport: already listening';
export const NATIVE_INTERFACE_NOT_AVAILABLE = '@trezor/transport: native interface not available';

// todo: this error might mean the same as MALFORMED_DATA or maybe MALFORMED_PROTOBUF or MALFORMED_WIRE_FORMAT
export const PROTOCOL_HEADER_SIGNATURE =
    "@trezor/transport: Didn't receive expected header signature.";

// todo: errors from bridge, they probably should be handled all
// https://github.dev/trezor/trezord-go/blob/8f35971d3c36ea8b91ff54810397526ef8e741c5/core/core.go#L138
export const WRONG_PREVIOUS_SESSION = 'wrong previous session';
export const SESSION_NOT_FOUND = 'session not found';
export const MALFORMED_DATA = 'malformed data';
export const OTHER_CALL_IN_PROGRESS = 'other call in progress';
// https://github.dev/trezor/trezord-go/blob/8f35971d3c36ea8b91ff54810397526ef8e741c5/wire/protobuf.go#L14
export const MALFORMED_PROTOBUF = 'malformed protobuf';
// https://github.dev/trezor/trezord-go/blob/8f35971d3c36ea8b91ff54810397526ef8e741c5/wire/v1.go#L72
export const MALFORMED_WIRE_FORMAT = 'malformed wire format';

// this is probably low level usb error, can not be found in bridge repo
// todo: isn't this the same like session not found?
export const DEVICE_DISCONNECTED = 'device disconnected during action';
