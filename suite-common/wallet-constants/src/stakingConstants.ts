// source is a required parameter for some functions in the Everstake Wallet SDK.
// This parameter is used for some contract calls.
// It is a constant which allows the SDK to define which app calls its functions.
// Each app which integrates the SDK has its own source, e.g. source for Trezor Suite is '1'.
export const WALLET_SDK_SOURCE = '1';

// token is a required parameter for some functions in the Everstake Wallet SDK.
// this parameter is unique for each app which integrates the SDK.
export const WALLET_SDK_TOKEN = 'c5585433-a0ad-4446-90d0-558fe8df22fa';
