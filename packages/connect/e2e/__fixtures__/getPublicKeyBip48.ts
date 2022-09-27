export default {
    method: 'getPublicKey',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: 'bip 48 SPENDWITNESS (implicitly returns zpub)',
            params: {
                path: "m/48'/0'/0'/2'/0/0",
                coin: 'btc',
            },
            result: {
                xpubSegwit:
                    'zpub6wECHaiZeZ9cuPQjdWrGiNCz8zJB2JB16ENHZz8KhbvkxzvRtC3kyzs7PtKMeGNos6QAmexY1MmgRgbEncrWHuhUhcSbcJ1CHphHtg3HcZj',
                xpub: 'xpub6HZfgFNjMC4fCo2VxoH2JC1yo41H94C1G1Kr1CLYwbAzroHyNsidjsYqMUQBeT4y3pAZGhmR634af7N7ME2UhSLGxw3kSUNDkNa17X6skwe',
            },
        },
        {
            description: 'bip 48 SPENDP2SHWITNESS (implicitly returns ypub)',
            params: {
                path: "m/48'/0'/0'/1'/0/0",
                coin: 'btc',
            },
            result: {
                xpub: 'xpub6J2XMT5GQZkqU14eNeP7H8DDWn66JpLJxUdcYbqZ2LrSSUrNoyA5NMgub9tM5dLND2VStfzQdt4m9jbsqeceUgmw5daCTB1TiN3nCuqaDTS',
                xpubSegwit:
                    'ypub6crnf7kBZFJKKJFmD1AjVDJigkEYFSKosb9qKzjSQMEKVafc4dKdzRM3cMqw5XzHcfcFe9ay6YRK32DSZM2fGvTXwyGd35pwz67RbRxgxa6',
            },
        },
        {
            description: 'bip 48 SPENDMULTISIG',
            params: {
                path: "m/48'/0'/0'/0'/0/0",
                coin: 'btc',
            },
            result: {
                xpub: 'xpub6HPqwmk3y75QR9S27EzDLXoGBAha9DepXPY5T4YfUMTLdiMxwjqaqgYqsV28PCpCuzpcbSawiS9mRGtX3zRQ4dvETW69RQ9RLyQ3gZ5J6Lb',
            },
        },
    ],
};
