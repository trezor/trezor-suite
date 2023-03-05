/* eslint-disable import/no-default-export */

export default {
    transformUtxos: [
        {
            description: 'transform blockfrost utxo',
            utxos: [
                {
                    address:
                        'addr1qywvux9d5u4cqyzrhp587sty33gt5pl5hpxmnzrw5nk5j87fdzm3eywgf7uexyytfzfcrp4hhcck7ch9kd753k33jpyqa3mzep',
                    path: 'path',
                    utxoData: {
                        tx_hash: '28172ea876c3d1e691284e5179fae2feb3e69d7d41e43f8023dc380115741026',
                        amount: [
                            { unit: 'lovelace', quantity: '1000000' },
                            {
                                unit: 'b863bc7369f46136ac1048adb2fa7dae3af944c3bbb2be2f216a8d4f42657272795361707068697265',
                                quantity: '100',
                            },
                        ],
                        output_index: 1,
                        tx_index: 1,
                        block: '5c571f83fe6c784d3fbc223792627ccf0eea96773100f9aedecf8b1eda4544d7',
                    },
                    blockInfo: {
                        confirmations: 100,
                        height: 101,
                    },
                },
                {
                    address:
                        'addr1qywvux9d5u4cqyzrhp587sty33gt5pl5hpxmnzrw5nk5j87fdzm3eywgf7uexyytfzfcrp4hhcck7ch9kd753k33jpyqa3mzep',
                    path: 'path2',
                    utxoData: {
                        tx_hash: '28172ea876c3d1e691284e5179fae2feb3e69d7d41e43f8023dc380115741026',
                        amount: [
                            { unit: 'lovelace', quantity: '1000000' },
                            {
                                unit: 'b863bc7369f46136ac1048adb2fa7dae3af944c3bbb2be2f216a8d4f42657272795361707068697265',
                                quantity: '100',
                            },
                        ],
                        output_index: 2,
                        tx_index: 1,
                        block: '5c571f83fe6c784d3fbc223792627ccf0eea96773100f9aedecf8b1eda4544d7',
                    },
                    blockInfo: {
                        confirmations: 0,
                        height: undefined,
                    },
                },
            ],
            result: [
                {
                    address:
                        'addr1qywvux9d5u4cqyzrhp587sty33gt5pl5hpxmnzrw5nk5j87fdzm3eywgf7uexyytfzfcrp4hhcck7ch9kd753k33jpyqa3mzep',
                    txid: '28172ea876c3d1e691284e5179fae2feb3e69d7d41e43f8023dc380115741026',
                    confirmations: 100,
                    blockHeight: 101,
                    amount: '1000000',
                    vout: 1,
                    path: 'path',
                    cardanoSpecific: {
                        unit: 'lovelace',
                    },
                },
                {
                    address:
                        'addr1qywvux9d5u4cqyzrhp587sty33gt5pl5hpxmnzrw5nk5j87fdzm3eywgf7uexyytfzfcrp4hhcck7ch9kd753k33jpyqa3mzep',
                    txid: '28172ea876c3d1e691284e5179fae2feb3e69d7d41e43f8023dc380115741026',
                    confirmations: 100,
                    blockHeight: 101,
                    amount: '100',
                    vout: 1,
                    path: 'path',
                    cardanoSpecific: {
                        unit: 'b863bc7369f46136ac1048adb2fa7dae3af944c3bbb2be2f216a8d4f42657272795361707068697265',
                    },
                },
                {
                    address:
                        'addr1qywvux9d5u4cqyzrhp587sty33gt5pl5hpxmnzrw5nk5j87fdzm3eywgf7uexyytfzfcrp4hhcck7ch9kd753k33jpyqa3mzep',
                    txid: '28172ea876c3d1e691284e5179fae2feb3e69d7d41e43f8023dc380115741026',
                    confirmations: 0,
                    blockHeight: 0,
                    amount: '1000000',
                    vout: 2,
                    path: 'path2',
                    cardanoSpecific: {
                        unit: 'lovelace',
                    },
                },
                {
                    address:
                        'addr1qywvux9d5u4cqyzrhp587sty33gt5pl5hpxmnzrw5nk5j87fdzm3eywgf7uexyytfzfcrp4hhcck7ch9kd753k33jpyqa3mzep',
                    txid: '28172ea876c3d1e691284e5179fae2feb3e69d7d41e43f8023dc380115741026',
                    confirmations: 0,
                    blockHeight: 0,
                    amount: '100',
                    vout: 2,
                    path: 'path2',
                    cardanoSpecific: {
                        unit: 'b863bc7369f46136ac1048adb2fa7dae3af944c3bbb2be2f216a8d4f42657272795361707068697265',
                    },
                },
            ],
        },
    ],
    parseAsset: [
        {
            description: 'parse asset hex',
            hex: 'b863bc7369f46136ac1048adb2fa7dae3af944c3bbb2be2f216a8d4f42657272795361707068697265',
            result: {
                policyId: 'b863bc7369f46136ac1048adb2fa7dae3af944c3bbb2be2f216a8d4f',
                assetName: 'BerrySapphire',
            },
        },
    ],
    transformTokenInfo: [
        {
            description: 'transform Blockfrost tokens to TokenInfo[]',
            tokens: undefined,
            result: undefined,
        },
        {
            description: 'transform Blockfrost tokens to TokenInfo[]',
            tokens: [
                {
                    unit: 'b863bc7369f46136ac1048adb2fa7dae3af944c3bbb2be2f216a8d4f42657272795361707068697265',
                    quantity: '10',
                    decimals: 1,
                    fingerprint: 'asset1hwnpal5vap799t6kkjmjf6myhse4zl2vu4ahzz',
                },
                {
                    unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
                    quantity: '1',
                    decimals: 0,
                    fingerprint: 'asset1zvclg2cvj4e5jfz5vswf3sx0lasy79xn8cdap9',
                },
            ],
            result: [
                {
                    type: 'BLOCKFROST',
                    name: 'asset1hwnpal5vap799t6kkjmjf6myhse4zl2vu4ahzz',
                    address:
                        'b863bc7369f46136ac1048adb2fa7dae3af944c3bbb2be2f216a8d4f42657272795361707068697265',
                    symbol: 'BerrySapphire',
                    balance: '10',
                    decimals: 1,
                },
                {
                    type: 'BLOCKFROST',
                    name: 'asset1zvclg2cvj4e5jfz5vswf3sx0lasy79xn8cdap9',
                    address: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
                    symbol: 'GRIC',
                    balance: '1',
                    decimals: 0,
                },
            ],
        },
    ],
    transformInputOutput: [
        {
            description: 'transform Blockfrost inputs to VinVout[]',
            data: [
                {
                    address:
                        'addr1qyr6zqjvcecxjc67pyn3rkzuxds7hn797qwfxza4m98ke8zcp8vxfn2pa0wtnh0y38tpzy2vxe3aueftljtewmz4l9gqt84p5v',
                    amount: [
                        {
                            unit: 'lovelace',
                            quantity: '310354549454',
                        },
                    ],
                    tx_hash: '579e9a2f6cc699d692eb8af8e146cbb2f73a240cebb16393533b477781be02b1',
                    output_index: 1,
                    collateral: false,
                    data_hash: null,
                },
                {
                    address:
                        'addr1qxhvugm4k3ml22r6egvm0qa6z50r4y3hx8krkh9dq89z7v6cp8vxfn2pa0wtnh0y38tpzy2vxe3aueftljtewmz4l9gqvax6j2',
                    amount: [
                        {
                            unit: 'lovelace',
                            quantity: '1000000',
                        },
                    ],
                    tx_hash: 'd906b99f8eb06bfd7373fb0605ff55cf64f286ba7092699577c61bc3f9d94e61',
                    output_index: 0,
                    collateral: false,
                    data_hash: null,
                },
            ],

            asset: 'lovelace',
            result: [
                {
                    n: 1,
                    addresses: [
                        'addr1qyr6zqjvcecxjc67pyn3rkzuxds7hn797qwfxza4m98ke8zcp8vxfn2pa0wtnh0y38tpzy2vxe3aueftljtewmz4l9gqt84p5v',
                    ],
                    isAddress: true,
                    value: '310354549454',
                },
                {
                    n: 0,
                    addresses: [
                        'addr1qxhvugm4k3ml22r6egvm0qa6z50r4y3hx8krkh9dq89z7v6cp8vxfn2pa0wtnh0y38tpzy2vxe3aueftljtewmz4l9gqvax6j2',
                    ],
                    isAddress: true,
                    value: '1000000',
                },
            ],
        },
        {
            description: 'transform Blockfrost outputs to VinVout[]',
            data: [
                {
                    address:
                        'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                    amount: [
                        {
                            unit: 'lovelace',
                            quantity: '42690000',
                        },
                    ],
                    output_index: 0,
                    data_hash: null,
                },
                {
                    address:
                        'addr1q8rnvyhnafscr9pr892v2s9pry4lzkywhw0vwyeh2c7dzcjcp8vxfn2pa0wtnh0y38tpzy2vxe3aueftljtewmz4l9gqfnrvf3',
                    amount: [
                        {
                            unit: 'lovelace',
                            quantity: '310312684449',
                        },
                    ],
                    output_index: 1,
                    data_hash: null,
                },
            ],
            asset: 'lovelace',
            result: [
                {
                    n: 0,
                    addresses: [
                        'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                    ],
                    isAddress: true,
                    value: '42690000',
                },
                {
                    n: 1,
                    addresses: [
                        'addr1q8rnvyhnafscr9pr892v2s9pry4lzkywhw0vwyeh2c7dzcjcp8vxfn2pa0wtnh0y38tpzy2vxe3aueftljtewmz4l9gqfnrvf3',
                    ],
                    isAddress: true,
                    value: '310312684449',
                },
            ],
        },
    ],

    transformAccountInfo: [
        {
            description: 'Transform account info (with txs)',
            data: {
                descriptor:
                    '6d17587575a3b4f0f86ebad3977e8f7e4981faa863eccf5c1467065c74fe3435943769446dd290d103fb3d360128e86de4b47faea73ffb0900c94c6a61ef9ea2',
                empty: false,
                balance: '27429803',
                availableBalance: '27256514',
                history: {
                    total: 1,
                    unconfirmed: 0,
                    transactions: [
                        {
                            address:
                                'addr1q9f9jr6e48u63ym65esmrwgle84zspnrsew37gwe88e0zfy9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usxwwdwc',
                            txData: {
                                hash: 'd958d03328c778a3162ffa4bd346a132177eb24c3ffdefe8bff0ec45de79e397',
                                block: 'eb1b2e79036d9fe2fccf0348df6109ab55ce2dba66c28aab84ec56cea0b5ba8d',
                                block_height: 6133187,
                                block_time: 1629388426,
                                slot: 37822135,
                                index: 11,
                                output_amount: [
                                    {
                                        unit: 'lovelace',
                                        quantity: '25737997',
                                    },
                                ],
                                fees: '171265',
                                deposit: '0',
                                size: 357,
                                invalid_before: null,
                                invalid_hereafter: null,
                                utxo_count: 2,
                                withdrawal_count: 1,
                                mir_cert_count: 0,
                                delegation_count: 0,
                                stake_cert_count: 0,
                                pool_update_count: 0,
                                pool_retire_count: 0,
                                asset_mint_or_burn_count: 0,
                                redeemer_count: 0,
                                valid_contract: true,
                            },
                            txUtxos: {
                                hash: 'd958d03328c778a3162ffa4bd346a132177eb24c3ffdefe8bff0ec45de79e397',
                                inputs: [
                                    {
                                        address:
                                            'addr1qxv0q8r02xlrea3nr3p0zthpg5slg2sk263rszm6cmgnx259ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usyu5v2j',
                                        amount: [
                                            {
                                                unit: 'lovelace',
                                                quantity: '25179197',
                                            },
                                        ],
                                        tx_hash:
                                            'f77df4c27b5ee4cf82eed076cd0ea1a83da59718c5ad4881b822d21de78c1284',
                                        output_index: 1,
                                        collateral: false,
                                        data_hash: null,
                                    },
                                ],
                                outputs: [
                                    {
                                        address:
                                            'addr1q9f9jr6e48u63ym65esmrwgle84zspnrsew37gwe88e0zfy9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usxwwdwc',
                                        amount: [
                                            {
                                                unit: 'lovelace',
                                                quantity: '25737997',
                                            },
                                        ],
                                        output_index: 0,
                                        data_hash: null,
                                    },
                                ],
                            },
                            txHash: 'd958d03328c778a3162ffa4bd346a132177eb24c3ffdefe8bff0ec45de79e397',
                        },
                    ],
                },
                page: {
                    index: 1,
                    size: 25,
                    total: 1,
                },
                misc: {
                    staking: {
                        address: 'stake1uxzutrtmxwv2rf2j3hdpps66ch0jydmkr58vwgnetddcdwg32u4rc',
                        rewards: '173289',
                        isActive: true,
                        poolId: 'pool1pu5jlj4q9w9jlxeu370a3c9myx47md5j5m2str0naunn2q3lkdy',
                    },
                },
                tokens: [
                    {
                        unit: '2f712364ec46f0cf707d412106ce71ef3370f76e27fb56b6bb14708776657465726e696b4e657a6a6564656e79',
                        quantity: '1',
                        decimals: 0,
                        fingerprint: 'asset1eevmdlaz5424s3663ypw8w4vyxdlxkm3lefz06',
                    },
                ],
                addresses: {
                    change: [
                        {
                            address:
                                'addr1q9f9jr6e48u63ym65esmrwgle84zspnrsew37gwe88e0zfy9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usxwwdwc',
                            path: "m/1852'/1815'/i'/1/0",
                            transfers: 3,
                            received: '66253740',
                            sent: '40515743',
                        },
                        {
                            address:
                                'addr1q99hnk2vnx708l86mujpfs9end50em9s95grhe3v4933m259ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usr7qlze',
                            path: "m/1852'/1815'/i'/1/1",
                            transfers: 2,
                            received: '35347470',
                            sent: '35347470',
                        },
                        {
                            address:
                                'addr1qxv0q8r02xlrea3nr3p0zthpg5slg2sk263rszm6cmgnx259ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usyu5v2j',
                            path: "m/1852'/1815'/i'/1/2",
                            transfers: 2,
                            received: '25179197',
                            sent: '25179197',
                        },
                    ],
                    used: [
                        {
                            address:
                                'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                            path: "m/1852'/1815'/i'/0/0",
                            transfers: 3,
                            received: '44208517',
                            sent: '42690000',
                        },
                    ],
                    unused: [
                        {
                            address:
                                'addr1qxnthyxq8x9lv95h74k5av3sy3yzljr56ttxu4lggv8qstv9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6us8mueja',
                            path: "m/1852'/1815'/i'/0/1",
                            transfers: 0,
                            received: '0',
                            sent: '0',
                        },
                    ],
                },
            },
            result: {
                descriptor:
                    '6d17587575a3b4f0f86ebad3977e8f7e4981faa863eccf5c1467065c74fe3435943769446dd290d103fb3d360128e86de4b47faea73ffb0900c94c6a61ef9ea2',
                empty: false,
                balance: '27429803',
                availableBalance: '27256514',
                history: {
                    total: 1,
                    unconfirmed: 0,
                    transactions: [
                        {
                            type: 'self',
                            txid: 'd958d03328c778a3162ffa4bd346a132177eb24c3ffdefe8bff0ec45de79e397',
                            blockTime: 1629388426,
                            blockHeight: 6133187,
                            blockHash:
                                'eb1b2e79036d9fe2fccf0348df6109ab55ce2dba66c28aab84ec56cea0b5ba8d',
                            amount: '171265',
                            fee: '171265',
                            targets: [],
                            tokens: [],
                            cardanoSpecific: {
                                subtype: 'withdrawal',
                                withdrawal: '730065',
                                deposit: undefined,
                            },
                            details: {
                                vin: [
                                    {
                                        n: 1,
                                        addresses: [
                                            'addr1qxv0q8r02xlrea3nr3p0zthpg5slg2sk263rszm6cmgnx259ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usyu5v2j',
                                        ],
                                        isAddress: true,
                                        value: '25179197',
                                        isAccountOwned: true,
                                    },
                                ],
                                vout: [
                                    {
                                        n: 0,
                                        addresses: [
                                            'addr1q9f9jr6e48u63ym65esmrwgle84zspnrsew37gwe88e0zfy9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usxwwdwc',
                                        ],
                                        isAddress: true,
                                        value: '25737997',
                                        isAccountOwned: true,
                                    },
                                ],
                                size: 357,
                                totalInput: '25179197',
                                totalOutput: '25737997',
                            },
                        },
                    ],
                },
                page: {
                    index: 1,
                    size: 25,
                    total: 1,
                },
                misc: {
                    staking: {
                        address: 'stake1uxzutrtmxwv2rf2j3hdpps66ch0jydmkr58vwgnetddcdwg32u4rc',
                        rewards: '173289',
                        isActive: true,
                        poolId: 'pool1pu5jlj4q9w9jlxeu370a3c9myx47md5j5m2str0naunn2q3lkdy',
                    },
                },
                tokens: [
                    {
                        type: 'BLOCKFROST',
                        name: 'asset1eevmdlaz5424s3663ypw8w4vyxdlxkm3lefz06',
                        address:
                            '2f712364ec46f0cf707d412106ce71ef3370f76e27fb56b6bb14708776657465726e696b4e657a6a6564656e79',
                        symbol: 'veternikNezjedeny',
                        balance: '1',
                        decimals: 0,
                    },
                ],
                addresses: {
                    change: [
                        {
                            address:
                                'addr1q9f9jr6e48u63ym65esmrwgle84zspnrsew37gwe88e0zfy9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usxwwdwc',
                            path: "m/1852'/1815'/i'/1/0",
                            transfers: 3,
                            received: '66253740',
                            sent: '40515743',
                        },
                        {
                            address:
                                'addr1q99hnk2vnx708l86mujpfs9end50em9s95grhe3v4933m259ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usr7qlze',
                            path: "m/1852'/1815'/i'/1/1",
                            transfers: 2,
                            received: '35347470',
                            sent: '35347470',
                        },
                        {
                            address:
                                'addr1qxv0q8r02xlrea3nr3p0zthpg5slg2sk263rszm6cmgnx259ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usyu5v2j',
                            path: "m/1852'/1815'/i'/1/2",
                            transfers: 2,
                            received: '25179197',
                            sent: '25179197',
                        },
                    ],
                    used: [
                        {
                            address:
                                'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                            path: "m/1852'/1815'/i'/0/0",
                            transfers: 3,
                            received: '44208517',
                            sent: '42690000',
                        },
                    ],
                    unused: [
                        {
                            address:
                                'addr1qxnthyxq8x9lv95h74k5av3sy3yzljr56ttxu4lggv8qstv9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6us8mueja',
                            path: "m/1852'/1815'/i'/0/1",
                            transfers: 0,
                            received: '0',
                            sent: '0',
                        },
                    ],
                },
            },
        },
        {
            description: 'Transform account info (basic)',
            data: {
                descriptor:
                    '6d17587575a3b4f0f86ebad3977e8f7e4981faa863eccf5c1467065c74fe3435943769446dd290d103fb3d360128e86de4b47faea73ffb0900c94c6a61ef9ea2',
                empty: false,
                balance: '27429803',
                availableBalance: '27256514',
                history: {
                    total: 6,
                    unconfirmed: 0,
                },
                page: {
                    index: 1,
                    size: 25,
                    total: 1,
                },
                misc: {
                    staking: {
                        address: 'stake1uxzutrtmxwv2rf2j3hdpps66ch0jydmkr58vwgnetddcdwg32u4rc',
                        rewards: '173289',
                        isActive: true,
                        poolId: 'pool1pu5jlj4q9w9jlxeu370a3c9myx47md5j5m2str0naunn2q3lkdy',
                    },
                },
            },
            result: {
                descriptor:
                    '6d17587575a3b4f0f86ebad3977e8f7e4981faa863eccf5c1467065c74fe3435943769446dd290d103fb3d360128e86de4b47faea73ffb0900c94c6a61ef9ea2',
                empty: false,
                balance: '27429803',
                availableBalance: '27256514',
                history: {
                    total: 6,
                    unconfirmed: 0,
                    transactions: [],
                },
                page: {
                    index: 1,
                    size: 25,
                    total: 1,
                },
                misc: {
                    staking: {
                        address: 'stake1uxzutrtmxwv2rf2j3hdpps66ch0jydmkr58vwgnetddcdwg32u4rc',
                        rewards: '173289',
                        isActive: true,
                        poolId: 'pool1pu5jlj4q9w9jlxeu370a3c9myx47md5j5m2str0naunn2q3lkdy',
                    },
                },
            },
        },
    ],

    transformTransaction: [
        {
            description: 'Transform transaction (recv)',
            descriptor:
                '6d17587575a3b4f0f86ebad3977e8f7e4981faa863eccf5c1467065c74fe3435943769446dd290d103fb3d360128e86de4b47faea73ffb0900c94c6a61ef9ea2',
            accountAddress: {
                change: [
                    {
                        address:
                            'addr1q9f9jr6e48u63ym65esmrwgle84zspnrsew37gwe88e0zfy9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usxwwdwc',
                        path: "m/1852'/1815'/i'/1/0",
                        transfers: 3,
                        received: '66253740',
                        sent: '40515743',
                    },
                ],
                used: [
                    {
                        address:
                            'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                        path: "m/1852'/1815'/i'/0/0",
                        transfers: 3,
                        received: '44208517',
                        sent: '42690000',
                    },
                ],
                unused: [
                    {
                        address:
                            'addr1qxnthyxq8x9lv95h74k5av3sy3yzljr56ttxu4lggv8qstv9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6us8mueja',
                        path: "m/1852'/1815'/i'/0/1",
                        transfers: 0,
                        received: '0',
                        sent: '0',
                    },
                ],
            },
            data: {
                address:
                    'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                txData: {
                    hash: '96a4ed36f2f117ba0096b7f3c8f28b6dbca0846cbb15662f90fa7b0b08fc7529',
                    block: '0eed37582508f89e98bc148a3be79856a6e03a98a8e9d206634797d49655da05',
                    block_height: 5553000,
                    block_time: 1617638687,
                    slot: 26072396,
                    index: 32,
                    output_amount: [
                        {
                            unit: 'lovelace',
                            quantity: '11064251',
                        },
                        {
                            unit: '2f712364ec46f0cf707d412106ce71ef3370f76e27fb56b6bb14708776657465726e696b4e657a6a6564656e79',
                            quantity: '1',
                            fingerprint: 'asset1eevmdlaz5424s3663ypw8w4vyxdlxkm3lefz06',
                        },
                        {
                            unit: 'd894897411707efa755a76deb66d26dfd50593f2e70863e1661e98a07370616365636f696e73',
                            quantity: '125000',
                        },
                    ],
                    fees: '178745',
                    deposit: '0',
                    size: 527,
                    invalid_before: null,
                    invalid_hereafter: '26079548',
                    utxo_count: 4,
                    withdrawal_count: 0,
                    mir_cert_count: 0,
                    delegation_count: 0,
                    stake_cert_count: 0,
                    pool_update_count: 0,
                    pool_retire_count: 0,
                    asset_mint_or_burn_count: 0,
                    redeemer_count: 0,
                    valid_contract: true,
                },
                txUtxos: {
                    hash: '96a4ed36f2f117ba0096b7f3c8f28b6dbca0846cbb15662f90fa7b0b08fc7529',
                    inputs: [
                        {
                            address:
                                'addr1q9xs9lap3u85z7qvy4q5692x89apjw7pafmxp4n4x8jqzd9re5df3pzwwmyq946axfcejy5n4x0y99wqpgtp2gd0k09q75jn6n',
                            amount: [
                                {
                                    unit: 'lovelace',
                                    quantity: '5801766',
                                },
                                {
                                    unit: '2f712364ec46f0cf707d412106ce71ef3370f76e27fb56b6bb14708776657465726e696b4e657a6a6564656e79',
                                    quantity: '1',
                                    fingerprint: 'asset1eevmdlaz5424s3663ypw8w4vyxdlxkm3lefz06',
                                },
                            ],
                            tx_hash:
                                '98fd7fb7fe83b25683e434e27d5c898e6e260673c8aa4279235456e70f868fe9',
                            output_index: 1,
                            collateral: false,
                            data_hash: null,
                        },
                        {
                            address:
                                'addr1q9p4hlek40exjf07rxj7xcyu5hp9scrs3c6a7rwmhjrtgtare5df3pzwwmyq946axfcejy5n4x0y99wqpgtp2gd0k09qvgjjr8',
                            amount: [
                                {
                                    unit: 'lovelace',
                                    quantity: '5441230',
                                },
                                {
                                    unit: 'd894897411707efa755a76deb66d26dfd50593f2e70863e1661e98a07370616365636f696e73',
                                    quantity: '125000',
                                },
                            ],
                            tx_hash:
                                'd9c4c4913448af14a68c2ca84a01a701970b048054ea1e95e19a921404f12c1b',
                            output_index: 1,
                            collateral: false,
                            data_hash: null,
                        },
                    ],
                    outputs: [
                        {
                            address:
                                'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                            amount: [
                                {
                                    unit: 'lovelace',
                                    quantity: '1518517',
                                },
                                {
                                    unit: '2f712364ec46f0cf707d412106ce71ef3370f76e27fb56b6bb14708776657465726e696b4e657a6a6564656e79',
                                    quantity: '1',
                                    decimals: 0,
                                    fingerprint: 'asset1eevmdlaz5424s3663ypw8w4vyxdlxkm3lefz06',
                                },
                            ],
                            output_index: 0,
                            data_hash: null,
                        },
                        {
                            address:
                                'addr1qxma8xr9wqjl2wtaj8vspnwmvx62g3msx76ryrnssq24rk4re5df3pzwwmyq946axfcejy5n4x0y99wqpgtp2gd0k09qejv880',
                            amount: [
                                {
                                    unit: 'lovelace',
                                    quantity: '9545734',
                                },
                                {
                                    unit: 'd894897411707efa755a76deb66d26dfd50593f2e70863e1661e98a07370616365636f696e73',
                                    quantity: '125000',
                                },
                            ],
                            output_index: 1,
                            data_hash: null,
                        },
                    ],
                },
                txHash: '96a4ed36f2f117ba0096b7f3c8f28b6dbca0846cbb15662f90fa7b0b08fc7529',
            },
            result: {
                type: 'recv',
                txid: '96a4ed36f2f117ba0096b7f3c8f28b6dbca0846cbb15662f90fa7b0b08fc7529',
                blockTime: 1617638687,
                blockHeight: 5553000,
                blockHash: '0eed37582508f89e98bc148a3be79856a6e03a98a8e9d206634797d49655da05',
                amount: '1518517',
                fee: '178745',
                targets: [
                    {
                        n: 0,
                        addresses: [
                            'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                        ],
                        isAddress: true,
                        amount: '1518517',
                        isAccountTarget: true,
                    },
                ],
                tokens: [
                    {
                        type: 'recv',
                        name: 'asset1eevmdlaz5424s3663ypw8w4vyxdlxkm3lefz06',
                        symbol: 'veternikNezjedeny',
                        address:
                            '2f712364ec46f0cf707d412106ce71ef3370f76e27fb56b6bb14708776657465726e696b4e657a6a6564656e79',
                        decimals: 0,
                        amount: '1',
                        from: 'addr1q9xs9lap3u85z7qvy4q5692x89apjw7pafmxp4n4x8jqzd9re5df3pzwwmyq946axfcejy5n4x0y99wqpgtp2gd0k09q75jn6n',
                        to: 'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                    },
                ],
                details: {
                    vin: [
                        {
                            n: 1,
                            addresses: [
                                'addr1q9xs9lap3u85z7qvy4q5692x89apjw7pafmxp4n4x8jqzd9re5df3pzwwmyq946axfcejy5n4x0y99wqpgtp2gd0k09q75jn6n',
                            ],
                            isAddress: true,
                            value: '5801766',
                        },
                        {
                            n: 1,
                            addresses: [
                                'addr1q9p4hlek40exjf07rxj7xcyu5hp9scrs3c6a7rwmhjrtgtare5df3pzwwmyq946axfcejy5n4x0y99wqpgtp2gd0k09qvgjjr8',
                            ],
                            isAddress: true,
                            value: '5441230',
                        },
                    ],
                    vout: [
                        {
                            n: 0,
                            addresses: [
                                'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                            ],
                            isAddress: true,
                            value: '1518517',
                        },
                        {
                            n: 1,
                            addresses: [
                                'addr1qxma8xr9wqjl2wtaj8vspnwmvx62g3msx76ryrnssq24rk4re5df3pzwwmyq946axfcejy5n4x0y99wqpgtp2gd0k09qejv880',
                            ],
                            isAddress: true,
                            value: '9545734',
                        },
                    ],
                    size: 527,
                    totalInput: '11242996',
                    totalOutput: '11064251',
                },
            },
        },
        {
            description: 'Transform transaction (self)',
            descriptor:
                '6d17587575a3b4f0f86ebad3977e8f7e4981faa863eccf5c1467065c74fe3435943769446dd290d103fb3d360128e86de4b47faea73ffb0900c94c6a61ef9ea2',
            accountAddress: {
                change: [
                    {
                        address:
                            'addr1q9f9jr6e48u63ym65esmrwgle84zspnrsew37gwe88e0zfy9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usxwwdwc',
                        path: "m/1852'/1815'/i'/1/0",
                        transfers: 3,
                        received: '66253740',
                        sent: '40515743',
                    },
                ],
                used: [
                    {
                        address:
                            'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                        path: "m/1852'/1815'/i'/0/0",
                        transfers: 3,
                        received: '44208517',
                        sent: '42690000',
                    },
                ],
                unused: [
                    {
                        address:
                            'addr1qxnthyxq8x9lv95h74k5av3sy3yzljr56ttxu4lggv8qstv9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6us8mueja',
                        path: "m/1852'/1815'/i'/0/1",
                        transfers: 0,
                        received: '0',
                        sent: '0',
                    },
                ],
            },
            data: {
                address:
                    'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                txData: {
                    hash: '2d9de1f11cf6fd077132ad76ac5037dbaf5ad948e004b1716c5da5439cfe30f9',
                    block: 'cc6f013f903e771ce846c2e7be44b99fdfa2e3f063265283d6110d30cf09f780',
                    block_height: 5388860,
                    block_time: 1629388426,
                    slot: 22699433,
                    index: 7,
                    output_amount: [
                        {
                            unit: 'lovelace',
                            quantity: '40515743',
                        },
                    ],
                    fees: '174257',
                    deposit: '2000000',
                    size: 425,
                    invalid_before: null,
                    invalid_hereafter: '22706492',
                    utxo_count: 2,
                    withdrawal_count: 0,
                    mir_cert_count: 0,
                    delegation_count: 1,
                    stake_cert_count: 1,
                    pool_update_count: 0,
                    pool_retire_count: 0,
                    asset_mint_or_burn_count: 0,
                    redeemer_count: 0,
                    valid_contract: true,
                },
                txUtxos: {
                    hash: '2d9de1f11cf6fd077132ad76ac5037dbaf5ad948e004b1716c5da5439cfe30f9',
                    inputs: [
                        {
                            address:
                                'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                            amount: [
                                {
                                    unit: 'lovelace',
                                    quantity: '42690000',
                                },
                            ],
                            tx_hash:
                                '3774d5458f95a6d833e9284245a648ad9eedf141819a74a4f139af20f00c7e0f',
                            output_index: 0,
                            collateral: false,
                            data_hash: null,
                        },
                    ],
                    outputs: [
                        {
                            address:
                                'addr1q9f9jr6e48u63ym65esmrwgle84zspnrsew37gwe88e0zfy9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usxwwdwc',
                            amount: [
                                {
                                    unit: 'lovelace',
                                    quantity: '40515743',
                                },
                            ],
                            output_index: 0,
                            data_hash: null,
                        },
                    ],
                },
                txHash: '2d9de1f11cf6fd077132ad76ac5037dbaf5ad948e004b1716c5da5439cfe30f9',
            },
            result: {
                type: 'self',
                txid: '2d9de1f11cf6fd077132ad76ac5037dbaf5ad948e004b1716c5da5439cfe30f9',
                blockTime: 1629388426,
                blockHeight: 5388860,
                blockHash: 'cc6f013f903e771ce846c2e7be44b99fdfa2e3f063265283d6110d30cf09f780',
                amount: '174257',
                fee: '174257',
                targets: [],
                tokens: [],
                details: {
                    vin: [
                        {
                            n: 0,
                            addresses: [
                                'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                            ],
                            isAddress: true,
                            value: '42690000',
                        },
                    ],
                    vout: [
                        {
                            n: 0,
                            addresses: [
                                'addr1q9f9jr6e48u63ym65esmrwgle84zspnrsew37gwe88e0zfy9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usxwwdwc',
                            ],
                            isAddress: true,
                            value: '40515743',
                        },
                    ],
                    size: 425,
                    totalInput: '42690000',
                    totalOutput: '40515743',
                },
            },
        },
        {
            description: 'Transform transaction (sent)',
            descriptor:
                '6d17587575a3b4f0f86ebad3977e8f7e4981faa863eccf5c1467065c74fe3435943769446dd290d103fb3d360128e86de4b47faea73ffb0900c94c6a61ef9ea2',
            accountAddress: {
                change: [
                    {
                        address:
                            'addr1q9f9jr6e48u63ym65esmrwgle84zspnrsew37gwe88e0zfy9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usxwwdwc',
                        path: "m/1852'/1815'/i'/1/0",
                        transfers: 3,
                        received: '66253740',
                        sent: '40515743',
                    },
                    {
                        address:
                            'addr1q99hnk2vnx708l86mujpfs9end50em9s95grhe3v4933m259ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usr7qlze',
                        path: "m/1852'/1815'/i'/1/1",
                        transfers: 2,
                        received: '35347470',
                        sent: '35347470',
                    },
                    {
                        address:
                            'addr1qxv0q8r02xlrea3nr3p0zthpg5slg2sk263rszm6cmgnx259ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usyu5v2j',
                        path: "m/1852'/1815'/i'/1/2",
                        transfers: 2,
                        received: '25179197',
                        sent: '25179197',
                    },
                    {
                        address:
                            'addr1q93el09nevlnzm2td5e3g508lv9axhn2xzxevc9m6khfqny9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usq4u26u',
                        path: "m/1852'/1815'/i'/1/3",
                        transfers: 0,
                        received: '0',
                        sent: '0',
                    },
                ],
                used: [
                    {
                        address:
                            'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                        path: "m/1852'/1815'/i'/0/0",
                        transfers: 3,
                        received: '44208517',
                        sent: '42690000',
                    },
                ],
                unused: [
                    {
                        address:
                            'addr1qxnthyxq8x9lv95h74k5av3sy3yzljr56ttxu4lggv8qstv9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6us8mueja',
                        path: "m/1852'/1815'/i'/0/1",
                        transfers: 0,
                        received: '0',
                        sent: '0',
                    },
                ],
            },
            data: {
                address:
                    'addr1q9f9jr6e48u63ym65esmrwgle84zspnrsew37gwe88e0zfy9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usxwwdwc',
                txData: {
                    hash: 'd9a8ae2194e2e25e8079a04a4694e2679464a4f51512863a0008a35a85762ff0',
                    block: 'f1085bc718c5514e8f08354af8822b528c6eee5855d0f87ba5f4ede0f73a6067',
                    block_height: 5405008,
                    block_time: 1614600060,
                    slot: 23033769,
                    index: 0,
                    output_amount: [
                        {
                            unit: 'lovelace',
                            quantity: '40347470',
                        },
                    ],
                    fees: '168273',
                    deposit: '0',
                    size: 289,
                    invalid_before: null,
                    invalid_hereafter: '23040870',
                    utxo_count: 3,
                    withdrawal_count: 0,
                    mir_cert_count: 0,
                    delegation_count: 0,
                    stake_cert_count: 0,
                    pool_update_count: 0,
                    pool_retire_count: 0,
                    asset_mint_or_burn_count: 0,
                    redeemer_count: 0,
                    valid_contract: true,
                },
                txUtxos: {
                    hash: 'd9a8ae2194e2e25e8079a04a4694e2679464a4f51512863a0008a35a85762ff0',
                    inputs: [
                        {
                            address:
                                'addr1q9f9jr6e48u63ym65esmrwgle84zspnrsew37gwe88e0zfy9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usxwwdwc',
                            amount: [
                                {
                                    unit: 'lovelace',
                                    quantity: '40515743',
                                },
                            ],
                            tx_hash:
                                '2d9de1f11cf6fd077132ad76ac5037dbaf5ad948e004b1716c5da5439cfe30f9',
                            output_index: 0,
                            collateral: false,
                            data_hash: null,
                        },
                    ],
                    outputs: [
                        {
                            address:
                                'addr1qxrmuatfdt49ndqmxeq46zmu3daqcg078h26vwfe4nau8gpgtal0gcphul7kruzdrx6v4w78la7z5luz0xs375zz922sege8ks',
                            amount: [
                                {
                                    unit: 'lovelace',
                                    quantity: '5000000',
                                },
                            ],
                            output_index: 0,
                            data_hash: null,
                        },
                        {
                            address:
                                'addr1q99hnk2vnx708l86mujpfs9end50em9s95grhe3v4933m259ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usr7qlze',
                            amount: [
                                {
                                    unit: 'lovelace',
                                    quantity: '35347470',
                                },
                            ],
                            output_index: 1,
                            data_hash: null,
                        },
                    ],
                },
                txHash: 'd9a8ae2194e2e25e8079a04a4694e2679464a4f51512863a0008a35a85762ff0',
            },
            result: {
                type: 'sent',
                txid: 'd9a8ae2194e2e25e8079a04a4694e2679464a4f51512863a0008a35a85762ff0',
                blockTime: 1614600060,
                blockHeight: 5405008,
                blockHash: 'f1085bc718c5514e8f08354af8822b528c6eee5855d0f87ba5f4ede0f73a6067',
                amount: '5000000',
                fee: '168273',
                targets: [
                    {
                        n: 0,
                        addresses: [
                            'addr1qxrmuatfdt49ndqmxeq46zmu3daqcg078h26vwfe4nau8gpgtal0gcphul7kruzdrx6v4w78la7z5luz0xs375zz922sege8ks',
                        ],
                        isAddress: true,
                        amount: '5000000',
                    },
                ],
                tokens: [],
                details: {
                    vin: [
                        {
                            n: 0,
                            addresses: [
                                'addr1q9f9jr6e48u63ym65esmrwgle84zspnrsew37gwe88e0zfy9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usxwwdwc',
                            ],
                            isAddress: true,
                            value: '40515743',
                        },
                    ],
                    vout: [
                        {
                            n: 0,
                            addresses: [
                                'addr1qxrmuatfdt49ndqmxeq46zmu3daqcg078h26vwfe4nau8gpgtal0gcphul7kruzdrx6v4w78la7z5luz0xs375zz922sege8ks',
                            ],
                            isAddress: true,
                            value: '5000000',
                        },
                        {
                            n: 1,
                            addresses: [
                                'addr1q99hnk2vnx708l86mujpfs9end50em9s95grhe3v4933m259ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usr7qlze',
                            ],
                            isAddress: true,
                            value: '35347470',
                        },
                    ],
                    size: 289,
                    totalInput: '40515743',
                    totalOutput: '40347470',
                },
            },
        },
        {
            description: 'Transform transaction (self, stake registration)',
            descriptor:
                '6d17587575a3b4f0f86ebad3977e8f7e4981faa863eccf5c1467065c74fe3435943769446dd290d103fb3d360128e86de4b47faea73ffb0900c94c6a61ef9ea2',
            accountAddress: {
                change: [
                    {
                        address:
                            'addr1qy2mdeuujt253nzxz2v669nn8q0nlmsp7hx7e7qm73nwlpxhh5j3f89h33sgtjs8azqcwr9zmlu49plr870dalvmruxslxqfwt',
                        path: "m/1852'/1815'/i'/1/0",
                        transfers: 1,
                        received: '2825699',
                        sent: '0',
                    },
                    {
                        address:
                            'addr1qyx542efp7w244zpjkf2gj805leqls76hjyn7cpn8jw4rdkhh5j3f89h33sgtjs8azqcwr9zmlu49plr870dalvmruxsn7vajz',
                        path: "m/1852'/1815'/i'/1/1",
                        transfers: 0,
                        received: '0',
                        sent: '0',
                    },
                ],
                used: [
                    {
                        address:
                            'addr1qx6jxvhq2pnusc6xh0m9pt7pyrjyxy2rtpsx7lnsc325907hh5j3f89h33sgtjs8azqcwr9zmlu49plr870dalvmruxs9zkqe2',
                        path: "m/1852'/1815'/i'/0/0",
                        transfers: 2,
                        received: '2400000',
                        sent: '2400000',
                    },
                    {
                        address:
                            'addr1q8dsx5dtjd9rjuv78l5rn8827nw9hg7rj42q8gaakzg29g7hh5j3f89h33sgtjs8azqcwr9zmlu49plr870dalvmruxs0hzyx8',
                        path: "m/1852'/1815'/i'/0/1",
                        transfers: 2,
                        received: '5000000',
                        sent: '5000000',
                    },
                ],
                unused: [
                    {
                        address:
                            'addr1qy84tj63d8323q5rs3e7e3ds274h6zpx8ktuw3twl9yjr6khh5j3f89h33sgtjs8azqcwr9zmlu49plr870dalvmruxs530lvf',
                        path: "m/1852'/1815'/i'/0/2",
                        transfers: 0,
                        received: '0',
                        sent: '0',
                    },
                ],
            },
            data: {
                txData: {
                    hash: 'ae5d36efa351a9e4dbe3ae11ac3c0be65a710c2338874e5613aca5c22bd91cfe',
                    block: '4701eb448ccd0c976b01221235c35271d9c41cb0c6fb021d0c5e77ec81e34901',
                    block_height: 7004268,
                    block_time: 1647445260,
                    slot: 55878969,
                    index: 15,
                    output_amount: [
                        {
                            unit: 'lovelace',
                            quantity: '2825699',
                            decimals: 6,
                        },
                    ],
                    fees: '174301',
                    deposit: '2000000',
                    size: 425,
                    invalid_before: null,
                    invalid_hereafter: '55885702',
                    utxo_count: 2,
                    withdrawal_count: 0,
                    mir_cert_count: 0,
                    delegation_count: 1,
                    stake_cert_count: 1,
                    pool_update_count: 0,
                    pool_retire_count: 0,
                    asset_mint_or_burn_count: 0,
                    redeemer_count: 0,
                    valid_contract: true,
                },
                txUtxos: {
                    hash: 'ae5d36efa351a9e4dbe3ae11ac3c0be65a710c2338874e5613aca5c22bd91cfe',
                    inputs: [
                        {
                            address:
                                'addr1q8dsx5dtjd9rjuv78l5rn8827nw9hg7rj42q8gaakzg29g7hh5j3f89h33sgtjs8azqcwr9zmlu49plr870dalvmruxs0hzyx8',
                            amount: [
                                {
                                    unit: 'lovelace',
                                    quantity: '5000000',
                                    decimals: 6,
                                },
                            ],
                            tx_hash:
                                '6d88e622cb69163eca9df8ebda0a3e92fa5084dbcd2b6adfa8746841c31e87e9',
                            output_index: 0,
                            collateral: false,
                            data_hash: null,
                        },
                    ],
                    outputs: [
                        {
                            address:
                                'addr1qy2mdeuujt253nzxz2v669nn8q0nlmsp7hx7e7qm73nwlpxhh5j3f89h33sgtjs8azqcwr9zmlu49plr870dalvmruxslxqfwt',
                            amount: [
                                {
                                    unit: 'lovelace',
                                    quantity: '2825699',
                                    decimals: 6,
                                },
                            ],
                            output_index: 0,
                            data_hash: null,
                        },
                    ],
                },
                address:
                    'addr1q8dsx5dtjd9rjuv78l5rn8827nw9hg7rj42q8gaakzg29g7hh5j3f89h33sgtjs8azqcwr9zmlu49plr870dalvmruxs0hzyx8',
                txHash: 'ae5d36efa351a9e4dbe3ae11ac3c0be65a710c2338874e5613aca5c22bd91cfe',
            },
            result: {
                type: 'self',
                txid: 'ae5d36efa351a9e4dbe3ae11ac3c0be65a710c2338874e5613aca5c22bd91cfe',
                blockTime: 1647445260,
                blockHeight: 7004268,
                blockHash: '4701eb448ccd0c976b01221235c35271d9c41cb0c6fb021d0c5e77ec81e34901',
                amount: '174301',
                fee: '174301',
                targets: [],
                tokens: [],
                cardanoSpecific: {
                    subtype: 'stake_registration',
                    deposit: '2000000',
                },
                details: {
                    vin: [
                        {
                            n: 0,
                            addresses: [
                                'addr1q8dsx5dtjd9rjuv78l5rn8827nw9hg7rj42q8gaakzg29g7hh5j3f89h33sgtjs8azqcwr9zmlu49plr870dalvmruxs0hzyx8',
                            ],
                            isAddress: true,
                            value: '5000000',
                        },
                    ],
                    vout: [
                        {
                            n: 0,
                            addresses: [
                                'addr1qy2mdeuujt253nzxz2v669nn8q0nlmsp7hx7e7qm73nwlpxhh5j3f89h33sgtjs8azqcwr9zmlu49plr870dalvmruxslxqfwt',
                            ],
                            isAddress: true,
                            value: '2825699',
                        },
                    ],
                    size: 425,
                    totalInput: '5000000',
                    totalOutput: '2825699',
                },
            },
        },
        {
            description: 'Transform transaction (self, stake delegation)',
            descriptor:
                '6d17587575a3b4f0f86ebad3977e8f7e4981faa863eccf5c1467065c74fe3435943769446dd290d103fb3d360128e86de4b47faea73ffb0900c94c6a61ef9ea2',
            accountAddress: {
                change: [
                    {
                        address:
                            'addr1q93ut5vk0tdq9jzzxal0xtz836yptp6spyt4rdxdpk9lvstvuu7shup00h3xnnv47g0klxlf7svhkz7vcmflneehhmashp5mvn',
                        path: "m/1852'/1815'/i'/1/0",
                        transfers: 11,
                        received: '41329048',
                        sent: '41329048',
                    },
                    {
                        address:
                            'addr1qx72y832hl98wfrq4949785w53f9n66434qxq0w2fwvundtvuu7shup00h3xnnv47g0klxlf7svhkz7vcmflneehhmaslep6vx',
                        path: "m/1852'/1815'/i'/1/1",
                        transfers: 1,
                        received: '1083241',
                        sent: '0',
                    },
                ],
                used: [
                    {
                        address:
                            'addr1qxhdfak0gu9tm6qunj5l4mlcncg6yktznsxtk6dmee8krvtvuu7shup00h3xnnv47g0klxlf7svhkz7vcmflneehhmas5m4rfw',
                        path: "m/1852'/1815'/i'/0/0",
                        transfers: 5,
                        received: '7121215',
                        sent: '7121215',
                    },
                    {
                        address:
                            'addr1qy06cynvyj70wskrjpu4lntnr2fky4uh4tdt83qly6zs2fnvuu7shup00h3xnnv47g0klxlf7svhkz7vcmflneehhmasa59ma3',
                        path: "m/1852'/1815'/i'/0/1",
                        transfers: 9,
                        received: '5000000',
                        sent: '5000000',
                    },
                    {
                        address:
                            'addr1q8clk3mtn8s0tl3ge8gg23ejajwkyndnyyswvufpmh6h72nvuu7shup00h3xnnv47g0klxlf7svhkz7vcmflneehhmasqnks2g',
                        path: "m/1852'/1815'/i'/0/2",
                        transfers: 6,
                        received: '32000000',
                        sent: '32000000',
                    },
                ],
                unused: [
                    {
                        address:
                            'addr1qy0vma2ykn42vcqj69aky7j9ahja98063ejxh9vv5axdhhnvuu7shup00h3xnnv47g0klxlf7svhkz7vcmflneehhmas4f4pef',
                        path: "m/1852'/1815'/i'/0/3",
                        transfers: 0,
                        received: '0',
                        sent: '0',
                    },
                ],
            },
            data: {
                txData: {
                    hash: 'c5dd23c59aee8688fe068c7c25ebb18612cf3da0b04fce9f0d2293247421b18c',
                    block: '8e5015a14576e1ef2ce85440b2b39396626262223a4f1a3c0de0a575b0c6af5c',
                    block_height: 7012003,
                    block_time: 1647606759,
                    slot: 56040468,
                    index: 9,
                    output_amount: [
                        {
                            unit: 'lovelace',
                            quantity: '1083241',
                            decimals: 6,
                        },
                    ],
                    fees: '172805',
                    deposit: '0',
                    size: 391,
                    invalid_before: null,
                    invalid_hereafter: '56047354',
                    utxo_count: 2,
                    withdrawal_count: 0,
                    mir_cert_count: 0,
                    delegation_count: 1,
                    stake_cert_count: 0,
                    pool_update_count: 0,
                    pool_retire_count: 0,
                    asset_mint_or_burn_count: 0,
                    redeemer_count: 0,
                    valid_contract: true,
                },
                txUtxos: {
                    hash: 'c5dd23c59aee8688fe068c7c25ebb18612cf3da0b04fce9f0d2293247421b18c',
                    inputs: [
                        {
                            address:
                                'addr1q93ut5vk0tdq9jzzxal0xtz836yptp6spyt4rdxdpk9lvstvuu7shup00h3xnnv47g0klxlf7svhkz7vcmflneehhmashp5mvn',
                            amount: [
                                {
                                    unit: 'lovelace',
                                    quantity: '1256046',
                                    decimals: 6,
                                },
                            ],
                            tx_hash:
                                '40009d6d0a1901dff4722a78d23c448ccda3efe07ce0d06aeca4d7d29e53ea43',
                            output_index: 1,
                            collateral: false,
                            data_hash: null,
                        },
                    ],
                    outputs: [
                        {
                            address:
                                'addr1qx72y832hl98wfrq4949785w53f9n66434qxq0w2fwvundtvuu7shup00h3xnnv47g0klxlf7svhkz7vcmflneehhmaslep6vx',
                            amount: [
                                {
                                    unit: 'lovelace',
                                    quantity: '1083241',
                                    decimals: 6,
                                },
                            ],
                            output_index: 0,
                            data_hash: null,
                        },
                    ],
                },
                address:
                    'addr1q93ut5vk0tdq9jzzxal0xtz836yptp6spyt4rdxdpk9lvstvuu7shup00h3xnnv47g0klxlf7svhkz7vcmflneehhmashp5mvn',
                txHash: 'c5dd23c59aee8688fe068c7c25ebb18612cf3da0b04fce9f0d2293247421b18c',
            },
            result: {
                type: 'self',
                txid: 'c5dd23c59aee8688fe068c7c25ebb18612cf3da0b04fce9f0d2293247421b18c',
                blockTime: 1647606759,
                blockHeight: 7012003,
                blockHash: '8e5015a14576e1ef2ce85440b2b39396626262223a4f1a3c0de0a575b0c6af5c',
                amount: '172805',
                fee: '172805',
                targets: [],
                tokens: [],
                cardanoSpecific: {
                    subtype: 'stake_delegation',
                    deposit: undefined,
                    withdrawal: undefined,
                },
                details: {
                    vin: [
                        {
                            n: 1,
                            addresses: [
                                'addr1q93ut5vk0tdq9jzzxal0xtz836yptp6spyt4rdxdpk9lvstvuu7shup00h3xnnv47g0klxlf7svhkz7vcmflneehhmashp5mvn',
                            ],
                            isAddress: true,
                            value: '1256046',
                        },
                    ],
                    vout: [
                        {
                            n: 0,
                            addresses: [
                                'addr1qx72y832hl98wfrq4949785w53f9n66434qxq0w2fwvundtvuu7shup00h3xnnv47g0klxlf7svhkz7vcmflneehhmaslep6vx',
                            ],
                            isAddress: true,
                            value: '1083241',
                        },
                    ],
                    size: 391,
                    totalInput: '1256046',
                    totalOutput: '1083241',
                },
            },
        },
    ],
};
