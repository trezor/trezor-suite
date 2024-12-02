import { Account as CommonAccount, WalletAccountTransaction } from '@suite-common/wallet-types';

export const accounts: CommonAccount[] = [
    {
        deviceState: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@C906E19794613145E3DF45F4:0',
        index: 0,
        path: "m/84'/0'/0'",
        descriptor:
            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
        key: 'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT-btc-mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@C906E19794613145E3DF45F4:0',
        accountType: 'normal',
        symbol: 'btc',
        empty: false,
        visible: true,
        balance: '0',
        availableBalance: '0',
        formattedBalance: '0',
        tokens: [],
        addresses: {
            change: [
                {
                    address: 'bc1qktmhrsmsenepnnfst8x6j27l0uqv7ggrg8x38q',
                    path: "m/84'/0'/0'/1/0",
                    transfers: 0,
                },
                {
                    address: 'bc1q0tl5v4u3ct2xgf8cmzgsgx2t76vxpzy5y7afuj',
                    path: "m/84'/0'/0'/1/1",
                    transfers: 0,
                },
            ],
            used: [
                {
                    address: 'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk',
                    path: "m/84'/0'/0'/0/0",
                    transfers: 10,
                    balance: '0',
                    sent: '129992',
                    received: '129992',
                },
                {
                    address: 'bc1q7e6qu5smalrpgqrx9k2gnf0hgjyref5p36ru2m',
                    path: "m/84'/0'/0'/0/1",
                    transfers: 2,
                    balance: '0',
                    sent: '7086',
                    received: '7086',
                },
            ],
            unused: [
                {
                    address: 'bc1qfcjv620stvtzjeelg26ncgww8ks49zy8lracjz',
                    path: "m/84'/0'/0'/0/5",
                    transfers: 0,
                },
                {
                    address: 'bc1quqgq44wq0zjh6d920zs42nsy4n4ev5vt8nxke4',
                    path: "m/84'/0'/0'/0/6",
                    transfers: 0,
                },
            ],
        },
        utxo: [],
        history: {
            total: 17,
            unconfirmed: 0,
        },
        metadata: {
            key: 'xpub6DDUPHpUo4pcy43iJeZjbSVWGav1SMMmuWdMHiGtkK8rhKmfbomtkwW6GKs1GGAKehT6QRocrmda3WWxXawpjmwaUHfFRXuKrXSapdckEYF',
            1: {
                fileName: '',
                aesKey: '',
            },
        },
        networkType: 'bitcoin',
        page: {
            index: 1,
            size: 25,
            total: 1,
        },
        misc: undefined,
        marker: undefined,
        ts: 0,
    },
    {
        deviceState: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@C906E19794613145E3DF45F4:0',
        index: 0,
        path: "m/86'/0'/0'",
        descriptor:
            "tr([5c9e228d/86'/0'/0']xpub6Bw885JisRbcKmowfBvMmCxaFHodKn1VpmRmctmJJoM8D4DzyP4qJv8ZdD9V9r3SSGjmK2KJEDnvLH6f1Q4HrobEvnCeKydNvf1eir3RHZk/<0;1>/*)",
        key: "tr([5c9e228d/86'/0'/0']xpub6Bw885JisRbcKmowfBvMmCxaFHodKn1VpmRmctmJJoM8D4DzyP4qJv8ZdD9V9r3SSGjmK2KJEDnvLH6f1Q4HrobEvnCeKydNvf1eir3RHZk/<0;1>/*)-btc-mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@C906E19794613145E3DF45F4:0",
        accountType: 'taproot',
        symbol: 'btc',
        empty: false,
        visible: true,
        balance: '0',
        availableBalance: '0',
        formattedBalance: '0',
        tokens: [],
        addresses: {
            change: [
                {
                    address: 'bc1pgxdrjnuj9nktxhknwpc5ynu7d0ly68mjqmx39l9xtcpu7zpqmk7qnyecgs',
                    path: "m/86'/0'/0'/1/16",
                    transfers: 0,
                },
                {
                    address: 'bc1p47uug6jgnfakskkwdddg0qlv6ev9dexxu9qaadnlauhhnqlx2rus5s8usa',
                    path: "m/86'/0'/0'/1/17",
                    transfers: 0,
                },
            ],
            used: [
                {
                    address: 'bc1ptxs597p3fnpd8gwut5p467ulsydae3rp9z75hd99w8k3ljr9g9rqx6ynaw',
                    path: "m/86'/0'/0'/0/0",
                    transfers: 2,
                    balance: '0',
                    sent: '4065',
                    received: '4065',
                },
            ],
            unused: [
                {
                    address: 'bc1plca7n9vs7d906nwlqyvk0d0jxnxss6x7w3x2y879quuvj8xn3p3s7vrrl2',
                    path: "m/86'/0'/0'/0/1",
                    transfers: 0,
                },
                {
                    address: 'bc1pks4em3l8vg4zyk5xpcmgygh7elkhu03z3fqj48a2a2lv948cn4hsyltl3h',
                    path: "m/86'/0'/0'/0/2",
                    transfers: 0,
                },
            ],
        },
        utxo: [],
        history: {
            total: 2,
            unconfirmed: 0,
        },
        metadata: {
            key: 'xpub6Bw885JisRbcKmowfBvMmCxaFHodKn1VpmRmctmJJoM8D4DzyP4qJv8ZdD9V9r3SSGjmK2KJEDnvLH6f1Q4HrobEvnCeKydNvf1eir3RHZk',
            1: {
                fileName: '',
                aesKey: '',
            },
        },
        networkType: 'bitcoin',
        page: {
            index: 1,
            size: 25,
            total: 1,
        },
        misc: undefined,
        marker: undefined,
        ts: 0,
    },
];

export const transactions: { [key: string]: WalletAccountTransaction[] } = {
    'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT-btc-mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@C906E19794613145E3DF45F4:0':
        [
            {
                descriptor:
                    'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                deviceState: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@C906E19794613145E3DF45F4:0',
                symbol: 'btc',
                type: 'sent',
                txid: '81d00a47d55b4df0b7a0793533c337493775ceb7f9ae20789325e25051f3374c',
                blockTime: 1639725042,
                blockHeight: 714488,
                blockHash: '0000000000000000000acb6c816d8438abdedced3e0f42e20b06043e140c8e71',
                lockTime: 714487,
                amount: '0.00000456',
                fee: '0.0000011',
                targets: [
                    {
                        n: 0,
                        addresses: ['bc1qgw4et0c8lgc43yajxhen2rq78f8puc6s07hyjp'],
                        isAddress: true,
                        amount: '0.00000456',
                    },
                ],
                tokens: [],
                internalTransfers: [],
                rbf: true,
                details: {
                    vin: [
                        {
                            txid: 'a41342ea303735195d206fcc8559cff682d9f4859fb91ebfda45ba5abb0ce3b9',
                            vout: 1,
                            sequence: 4294967293,
                            n: 0,
                            addresses: ['bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk'],
                            isAddress: true,
                            value: '0.00000566',
                        },
                    ],
                    vout: [
                        {
                            value: '0.00000456',
                            n: 0,
                            hex: '001443ab95bf07fa315893b235f3350c1e3a4e1e6350',
                            addresses: ['bc1qgw4et0c8lgc43yajxhen2rq78f8puc6s07hyjp'],
                            isAddress: true,
                        },
                    ],
                    size: 191,
                    totalInput: '0.00000566',
                    totalOutput: '0.00000456',
                },
            },
            {
                descriptor:
                    'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                deviceState: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@C906E19794613145E3DF45F4:0',
                symbol: 'btc',
                type: 'recv',
                txid: 'd6c42e965f9e9a69b9eb1d48d09e787cae8020d86ed952548058c857f7bcfb7e',
                blockTime: 1639707387,
                blockHeight: 714458,
                blockHash: '00000000000000000000d761e44feb99d03e42ead4a82eeb870cce1077ca4a2a',
                amount: '0.00045716',
                fee: '0.00019938',
                targets: [
                    {
                        n: 62,
                        addresses: ['bc1q7zql632newlfv9rt269jyxdn30370rh4kp23pd'],
                        isAddress: true,
                        amount: '0.00045716',
                        isAccountTarget: true,
                    },
                ],
                tokens: [],
                internalTransfers: [],
                details: {
                    vin: [
                        {
                            txid: '851ee19aec76f2c823f2f181740942a41cc24de75ff7fac42e9b0d663358516b',
                            vout: 50,
                            sequence: 4294967295,
                            n: 0,
                            addresses: ['bc1q39kuc35n722fmy0nw3qqhpvg0ch8f0a6rt22xs'],
                            isAddress: true,
                            value: '4.03102789',
                        },
                    ],
                    vout: [
                        {
                            value: '0.00642597',
                            n: 0,
                            hex: 'a9146cd7c787e903ac4b41e4fd2e038a81cb696d5dbf87',
                            addresses: ['3BcXPstZ4ZHhvLxPFkjFocuFySKt8nsGgs'],
                            isAddress: true,
                        },
                        {
                            value: '0.00118444',
                            n: 1,
                            hex: 'a914fda68d9016d07280d410a1e930ea03445694d16887',
                            addresses: ['3QpCQP3A2q7kCr8QgsWuqG1Bg1P6RySonw'],
                            isAddress: true,
                        },
                    ],
                    size: 2582,
                    totalInput: '4.03102789',
                    totalOutput: '4.03082851',
                },
            },
        ],
    "tr([5c9e228d/86'/0'/0']xpub6Bw885JisRbcKmowfBvMmCxaFHodKn1VpmRmctmJJoM8D4DzyP4qJv8ZdD9V9r3SSGjmK2KJEDnvLH6f1Q4HrobEvnCeKydNvf1eir3RHZk/<0;1>/*)-btc-mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@C906E19794613145E3DF45F4:0":
        [
            {
                descriptor:
                    "tr([5c9e228d/86'/0'/0']xpub6Bw885JisRbcKmowfBvMmCxaFHodKn1VpmRmctmJJoM8D4DzyP4qJv8ZdD9V9r3SSGjmK2KJEDnvLH6f1Q4HrobEvnCeKydNvf1eir3RHZk/<0;1>/*)",
                deviceState: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@C906E19794613145E3DF45F4:0',
                symbol: 'btc',
                type: 'sent',
                txid: '350bb4ff380240fee0d2b7e1f7b90e719086de263cd02aedca105aec0c0bccc1',
                blockTime: 1636907730,
                blockHeight: 709699,
                blockHash: '00000000000000000001ce2f5db977cf422071a1f1744051759b848dc301c14f',
                amount: '0.00003695',
                fee: '0.0000037',
                targets: [
                    {
                        n: 0,
                        addresses: [
                            'OP_RETURN (Greetings from team Trezor!\nCelebrating the Taproot activation!)',
                        ],
                        isAddress: false,
                        amount: '0',
                    },
                    {
                        n: 1,
                        addresses: [
                            'bc1p3tytvld7eml53rgnytku02576ej0wtdjfwvhescwfc2lasad0uts8amxqf',
                        ],
                        isAddress: true,
                        amount: '0.00003695',
                    },
                ],
                tokens: [],
                internalTransfers: [],
                rbf: true,
                details: {
                    vin: [
                        {
                            txid: '9de9d10b829b4de8cba707a2b165de05e75db9863785ad9e344f9ff7b0426f7e',
                            sequence: 4294967293,
                            n: 0,
                            addresses: [
                                'bc1ptxs597p3fnpd8gwut5p467ulsydae3rp9z75hd99w8k3ljr9g9rqx6ynaw',
                            ],
                            isAddress: true,
                            value: '0.00004065',
                        },
                    ],
                    vout: [
                        {
                            value: '0',
                            n: 0,
                            hex: '6a3f4772656574696e67732066726f6d207465616d205472657a6f72210a43656c6562726174696e672074686520546170726f6f742061637469766174696f6e21',
                            addresses: [
                                'OP_RETURN (Greetings from team Trezor!\nCelebrating the Taproot activation!)',
                            ],
                            isAddress: false,
                        },
                        {
                            value: '0.00003695',
                            n: 1,
                            hex: '51208ac8b67dbeceff488d1322edc7aa9ed664f72db24b997cc30e4e15fec3ad7f17',
                            addresses: [
                                'bc1p3tytvld7eml53rgnytku02576ej0wtdjfwvhescwfc2lasad0uts8amxqf',
                            ],
                            isAddress: true,
                        },
                    ],
                    size: 236,
                    totalInput: '0.00004065',
                    totalOutput: '0.00003695',
                },
            },
            {
                descriptor:
                    "tr([5c9e228d/86'/0'/0']xpub6Bw885JisRbcKmowfBvMmCxaFHodKn1VpmRmctmJJoM8D4DzyP4qJv8ZdD9V9r3SSGjmK2KJEDnvLH6f1Q4HrobEvnCeKydNvf1eir3RHZk/<0;1>/*)",
                deviceState: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@C906E19794613145E3DF45F4:0',
                symbol: 'btc',
                type: 'recv',
                txid: '9de9d10b829b4de8cba707a2b165de05e75db9863785ad9e344f9ff7b0426f7e',
                blockTime: 1636907730,
                blockHeight: 709699,
                blockHash: '00000000000000000001ce2f5db977cf422071a1f1744051759b848dc301c14f',
                amount: '0.00004065',
                fee: '0.00000204',
                targets: [
                    {
                        n: 0,
                        addresses: [
                            'bc1ptxs597p3fnpd8gwut5p467ulsydae3rp9z75hd99w8k3ljr9g9rqx6ynaw',
                        ],
                        isAddress: true,
                        amount: '0.00004065',
                        isAccountTarget: true,
                    },
                ],
                tokens: [],
                internalTransfers: [],
                rbf: true,
                details: {
                    vin: [
                        {
                            txid: '1c91a7e5e0fdc80739ea978f13967644d9f2954db19d88a0b8181ddbb0f76375',
                            vout: 1,
                            sequence: 24,
                            n: 0,
                            addresses: [
                                'bc1pl95wk6jg94dzl6p4r5uakz2vrlhajlxman2ppvmckn4ymzty823ssj2pdq',
                            ],
                            isAddress: true,
                            value: '0.00004269',
                        },
                    ],
                    vout: [
                        {
                            value: '0.00004065',
                            n: 0,
                            hex: '512059a142f8314cc2d3a1dc5d035d7b9f811bdcc46128bd4bb4a571ed1fc8654146',
                            addresses: [
                                'bc1ptxs597p3fnpd8gwut5p467ulsydae3rp9z75hd99w8k3ljr9g9rqx6ynaw',
                            ],
                            isAddress: true,
                        },
                    ],
                    size: 162,
                    totalInput: '0.00004269',
                    totalOutput: '0.00004065',
                },
            },
        ],
};
