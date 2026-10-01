// Hex data field has 16kB limit for protobuf single message encoding in firmware.
// For UTF-16 encoding: 16384 B / 2 = 8192 B
export const ETHEREUM_DATA_MAX_BYTES = 8192;

// Ethereum nonces are uint64: max 18446744073709551615, which is 20 decimal digits.
export const ETHEREUM_NONCE_MAX_DIGITS = 20;
