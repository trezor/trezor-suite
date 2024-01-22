export const formInputsMaxLength = {
    pin: 50,
    passphrase: 50,

    // send form
    address: 150,
    amount: 255,
    fiat: 255,
    opReturn: 255,
    ethData: 255,
    btcLocktime: 10, // max: 4294967294
    xrpDestinationTag: 10, // max: 4294967295
} as const;
