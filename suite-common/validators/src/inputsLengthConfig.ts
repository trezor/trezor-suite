export const formInputsMaxLength = {
    pin: 50,
    passphrase: 50,

    // send form
    address: 150,
    amount: 255,
    fiat: 255,
    opReturn: 255,

    /**
     * - Hex data field has 16kB limit for protobuf single message encoding in firmware
     * - For UTF-16 encoding: 16384 B / 2 = 8192 B
     */
    ethData: 8192,

    btcLocktime: 10, // max: 4294967294
    xrpDestinationTag: 10, // max: 4294967295

    stellarTextMemo: 28, // https://developers.stellar.org/docs/learn/encyclopedia/transactions-specialized/memos
    solanaMemo: 566, // https://www.solana-program.com/docs/memo
} as const;
