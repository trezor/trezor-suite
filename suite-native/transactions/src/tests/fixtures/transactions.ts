import { WalletAccountTransaction } from '@suite-common/wallet-types';

export const transactionWithTargetInOutputs: WalletAccountTransaction = {
    descriptor:
        'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
    deviceState: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@C906E19794613145E3DF45F4:0',
    symbol: 'btc',
    type: 'recv',
    internalTransfers: [],
    txid: 'd6c42e965f9e9a69b9eb1d48d09e787cae8020d86ed952548058c857f7bcfb7e',
    blockTime: 1639707387,
    blockHeight: 714458,
    blockHash: '00000000000000000000d761e44feb99d03e42ead4a82eeb870cce1077ca4a2a',
    amount: '0.00045716',
    fee: '0.00019938',
    targets: [
        {
            n: 62,
            addresses: ['3QpCQP3A2q7kCr8QgsWuqG1Bg1P6RySonw'],
            isAddress: true,
            amount: '0.00118444',
            isAccountTarget: true,
        },
    ],
    tokens: [],
    details: {
        vin: [
            {
                txid: '851ee19aec76f2c823f2f181740942a41cc24de75ff7fac42e9b0d663358516b',
                vout: 50,
                sequence: 4294967295,
                n: 0,
                addresses: [
                    'bc1q39kuc35n722fmy0nw3qqhpvg0ch8f0a6rt22xs',
                    'bc346cd7c787e903ac4b41e4fd2e038a81cb696d5dbf87',
                ],
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
};

export const transactionWithChangeAddress: WalletAccountTransaction = {
    descriptor:
        'zpub6rjNNddoAVvuYaD6WPdxiqFEToQHgrERjWMg7kM9gGGk6rhPMWNEmL5X745FGqBq8Wp136LfA3A7UjRGEYdJrf8dUfshzNrb5rvaryNfVJf',
    deviceState: 'state@hiddenDeviceWithImportedAccounts:1',
    symbol: 'btc',
    type: 'sent',
    txid: 'b8ccb6e85d3c5fe008b0534d4f9ff8b1de71f2b7a3d856490b9a96f6ae1e49bb',
    blockTime: 1679482960,
    blockHeight: 781958,
    blockHash: '00000000000000000003111b544a1ed4663b2a0597dfa8420b2d2970226cdd1d',
    amount: '40107',
    fee: '2926',
    vsize: 209,
    feeRate: '14',
    targets: [
        {
            n: 1,
            addresses: ['bc1ql2ntmq4jlq5g2q53q89c7f7d27s35se96jq6kw'],
            isAddress: true,
            amount: '40107',
        },
    ],
    tokens: [],
    internalTransfers: [],
    rbf: true,
    details: {
        vin: [
            {
                txid: '85c6a01a7480aa98b342dfc4299a5682f9d0f35938f2c625758538db0b4a5c6e',
                sequence: 4294967293,
                n: 0,
                addresses: ['bc1qj477aj92qsttes0c5kgw9u4avkjh8w46kpf2ae'],
                isAddress: true,
                isOwn: true,
                value: '24800',
                isAccountOwned: true,
            },
            {
                txid: 'c9970eff2f35310d5405dbd41d90f89b231353823d16c59ce522d303cc432ac2',
                sequence: 4294967293,
                n: 1,
                addresses: ['bc1qqrueed2uvj42qql0qmn2rhwpum3k6mrhflc98f'],
                isAddress: true,
                isOwn: true,
                value: '37813',
                isAccountOwned: true,
            },
        ],
        vout: [
            {
                value: '19580',
                n: 0,
                spent: true,
                spentTxId: 'f7c9f241d186d96e17939409e76cd80a8f7a2c0ab53e3453201b6d810e5d519d',
                spentIndex: 2,
                spentHeight: 783739,
                hex: '00145d372607d35d7e107bd0ae22b1b083caa1b5e0c2',
                addresses: ['bc1qt5mjvp7nt4lpq77s4c3trvyre2smtcxz4zmmjs'],
                isAddress: true,
                isOwn: true,
                isAccountOwned: true,
            },
            {
                value: '40107',
                n: 1,
                spent: true,
                spentTxId: '017889b069d3baa1dd6c3f455619b92dbb22c4d403ba3e63605aa2bcb477f715',
                spentHeight: 781960,
                hex: '0014faa6bd82b2f82885029101cb8f27cd57a11a4325',
                addresses: ['bc1ql2ntmq4jlq5g2q53q89c7f7d27s35se96jq6kw'],
                isAddress: true,
            },
        ],
        size: 371,
        totalInput: '62613',
        totalOutput: '59687',
    },
};
