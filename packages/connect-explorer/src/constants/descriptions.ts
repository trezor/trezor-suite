export const descriptionDictionary: Record<string, string> = {
    path: 'Derivation path',
    showOnTrezor: 'Display the result on the Trezor device. Default is false',
    chunkify: 'Display the result in chunks for better readability. Default is false',
    suppressBackupWarning:
        'By default, this method will emit an event to show a warning if the wallet does not have a backup. This option suppresses the message.',
    coin: 'determines network definition specified in coins.json file. Coin shortcut, name or label can be used. If coin is not set API will try to get network definition from path.',
    crossChain:
        'Advanced feature. Use it only if you are know what you are doing. Allows to generate address between chains. For example Bitcoin path on Litecoin network will display cross chain address in Litecoin format.',
    unlockPath: 'the result of TrezorConnect.unlockPath method',
    ecdsaCurveName: 'ECDSA curve name to use',
    ignoreXpubMagic: 'ignore SLIP-0132 XPUB magic, use xpub/tpub prefix for all account types.',
    scriptType: 'used to distinguish between various address formats (non-segwit, segwit, etc.).',
};
