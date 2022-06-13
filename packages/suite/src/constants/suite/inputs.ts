export enum MAX_LENGTH {
    PIN = 50,
    PASSPHRASE = 50,

    BTC_MESSAGE = 255,
    ETH_MESSAGE = 255,

    // send form
    ADDRESS = 150,
    LABEL = 16,
    AMOUNT = 255,
    FIAT = 255,
    OP_RETURN = 255,
    ETH_DATA = 255,
    BTC_LOCKTIME = 10, // max: 4294967294
    XRP_DESTINATION_TAG = 10, // max: 4294967295
}
