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
                    address: 'asset1hwnpal5vap799t6kkjmjf6myhse4zl2vu4ahzz',
                    symbol: 'BerrySapphire',
                    balance: '10',
                    decimals: 1,
                },
                {
                    type: 'BLOCKFROST',
                    name: 'asset1zvclg2cvj4e5jfz5vswf3sx0lasy79xn8cdap9',
                    address: 'asset1zvclg2cvj4e5jfz5vswf3sx0lasy79xn8cdap9',
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
                            blockInfo: {
                                time: 1629388426,
                                height: 6133187,
                                hash: 'eb1b2e79036d9fe2fccf0348df6109ab55ce2dba66c28aab84ec56cea0b5ba8d',
                                slot: 37822135,
                                epoch: 285,
                                epoch_slot: 65335,
                                slot_leader:
                                    'pool1spus7k8cy5qcs82xhw60dwwk2d4vrfs0m5vr2zst04gtq700gjn',
                                size: 15564,
                                tx_count: 19,
                                output: '326988057275',
                                fees: '4097419',
                                block_vrf:
                                    'vrf_vk1v0encvmzxvrq6t7z8kcv97zfl6zs7cw9m3s668rw34vwkk9yqh4qsq0szv',
                                previous_block:
                                    'e18147e4eff0b67d5040ff3caee1822d16c44fdf64c97fc889b5d5d691504dad',
                                next_block:
                                    '71ba0798ed03a2a646d1b7cac5d1293c33f35104364e219d087ed7e1d1ac81b0',
                                confirmations: 253956,
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
                            totalSpent: '171265',
                            targets: [],
                            tokens: [],
                            details: {
                                vin: [
                                    {
                                        n: 1,
                                        addresses: [
                                            'addr1qxv0q8r02xlrea3nr3p0zthpg5slg2sk263rszm6cmgnx259ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usyu5v2j',
                                        ],
                                        isAddress: true,
                                        value: '25179197',
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
                        address: 'asset1eevmdlaz5424s3663ypw8w4vyxdlxkm3lefz06',
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
                blockInfo: {
                    time: 1617638687,
                    height: 5553000,
                    hash: '0eed37582508f89e98bc148a3be79856a6e03a98a8e9d206634797d49655da05',
                    slot: 26072396,
                    epoch: 257,
                    epoch_slot: 411596,
                    slot_leader: 'pool16kus5xvdysgmtjp0hhlwt72tsm0yn2zcn0a8wg9emc6c75lxvmc',
                    size: 25948,
                    tx_count: 37,
                    output: '10098502831419',
                    fees: '7777002',
                    block_vrf: 'vrf_vk1rrf0qyyv45pu7talhcdfzk4hc0273k54504vdralnu9tyul4xspqk7d35p',
                    previous_block:
                        '6778382568d10c6cd65782f0dcdf708c922363d7de199b84479288a09a5a4dd3',
                    next_block: 'cad86f7b8bb041c8028186504248358c08dfde96a5a1047106d819b68ef54785',
                    confirmations: 834086,
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
                totalSpent: '1518517',
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
                        name: 'veternikNezjedeny',
                        symbol: 'veternikNezjedeny',
                        address: 'asset1eevmdlaz5424s3663ypw8w4vyxdlxkm3lefz06',
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
                blockInfo: {
                    time: 1614265724,
                    height: 5388860,
                    hash: 'cc6f013f903e771ce846c2e7be44b99fdfa2e3f063265283d6110d30cf09f780',
                    slot: 22699433,
                    epoch: 250,
                    epoch_slot: 62633,
                    slot_leader: 'pool106jtt06k5wjpqc5r5fkz06pgwhwaljzs624mnfua8fkhq0fl9am',
                    size: 13066,
                    tx_count: 24,
                    output: '5352499144527',
                    fees: '4829037',
                    block_vrf: 'vrf_vk1zcjxl3gs09fmwwvy4tz5vgqsxtu7crrj6r4cntakp08htpkhw4qswskdm7',
                    previous_block:
                        'a3ab7d5d243586e81710df8ff248718a9e22d756659809eca63f20d164dcf424',
                    next_block: '9d426764791ded4396e8a40f244c7f06628503623b32a59b6550e2751256ad6c',
                    confirmations: 998099,
                },
                txHash: '2d9de1f11cf6fd077132ad76ac5037dbaf5ad948e004b1716c5da5439cfe30f9',
            },
            result: {
                type: 'self',
                txid: '2d9de1f11cf6fd077132ad76ac5037dbaf5ad948e004b1716c5da5439cfe30f9',
                blockTime: 1614265724,
                blockHeight: 5388860,
                blockHash: 'cc6f013f903e771ce846c2e7be44b99fdfa2e3f063265283d6110d30cf09f780',
                amount: '174257',
                fee: '174257',
                totalSpent: '174257',
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
                blockInfo: {
                    time: 1614600060,
                    height: 5405008,
                    hash: 'f1085bc718c5514e8f08354af8822b528c6eee5855d0f87ba5f4ede0f73a6067',
                    slot: 23033769,
                    epoch: 250,
                    epoch_slot: 396969,
                    slot_leader: 'pool15zrkyr0f80hxlt4scv72tej8l8zwrcphmrega9wutqchjekceal',
                    size: 5489,
                    tx_count: 10,
                    output: '877185047625',
                    fees: '1871739',
                    block_vrf: 'vrf_vk1973re7lsj6va8q8ly4tpedu9hr9mc28wehfwvhqszd3u48kndatszu3d8w',
                    previous_block:
                        '45c1b9457d0bb56d4cfcba1ca43c4686a9036d36a53a76da424c535f881b570d',
                    next_block: '4154b60f8fff61f096615f94268194d0bd34d9e8d5832290b557937f3ecfb7b6',
                    confirmations: 981951,
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
                totalSpent: '5168273',
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
    ],
};
