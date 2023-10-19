export const blockfrost = {
    GET_SERVER_INFO: {
        data: {
            name: 'BlockfrostMock',
            shortcut: 'ada',
            decimals: 6,
            testnet: false,
            version: '1.4.0',
            blockHash: 'test_block_hash-hash',
            blockHeight: 1,
        },
    },
    GET_BLOCK: {
        data: {
            time: 1506203091,
            height: null,
            hash: '5f20df933584822601f9e3f8c024eb5eb252fe8cefb24d1317dc3d432e940ebb',
            slot: null,
            epoch: null,
            epoch_slot: null,
            slot_leader: 'Genesis slot leader',
            size: 0,
            tx_count: 14505,
            output: '31112484745000000',
            fees: '0',
            block_vrf: null,
            previous_block: null,
            next_block: '89d9b5a5b8ddc8d7e5a6795e9774d97faf1efea59b2caf7eaf9f8c5b32059df4',
            confirmations: 5833137,
        },
    },
    GET_ACCOUNT_UTXO: {
        data: [
            {
                address:
                    'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                utxoData: {
                    tx_hash: '96a4ed36f2f117ba0096b7f3c8f28b6dbca0846cbb15662f90fa7b0b08fc7529',
                    tx_index: 0,
                    output_index: 0,
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
                    block: '0eed37582508f89e98bc148a3be79856a6e03a98a8e9d206634797d49655da05',
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
                    confirmations: 280424,
                },
            },
            {
                address:
                    'addr1q99hnk2vnx708l86mujpfs9end50em9s95grhe3v4933m259ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usr7qlze',
                utxoData: {
                    tx_hash: 'd9a8ae2194e2e25e8079a04a4694e2679464a4f51512863a0008a35a85762ff0',
                    tx_index: 1,
                    output_index: 1,
                    amount: [
                        {
                            unit: 'lovelace',
                            quantity: '35347470',
                        },
                    ],
                    block: 'f1085bc718c5514e8f08354af8822b528c6eee5855d0f87ba5f4ede0f73a6067',
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
                    confirmations: 428416,
                },
            },
        ],
    },
    GET_TRANSACTION: {
        data: {
            block: 'e6369fee087d31192016b1659f1c381e9fc4925339278a4eef6f340c96c1947f',
            block_height: 5040611,
            slot: 15650536,
            index: 0,
            output_amount: [
                {
                    unit: 'lovelace',
                    quantity: '701374004958',
                },
            ],
            fees: '874781',
            deposit: '0',
            size: 16346,
            invalid_before: null,
            invalid_hereafter: '15657684',
            utxo_count: 80,
            withdrawal_count: 0,
            delegation_count: 0,
            stake_cert_count: 0,
            pool_update_count: 0,
            pool_retire_count: 0,
        },
    },
    SUBSCRIBE_BLOCK: {
        data: {
            subscribed: true,
        },
    },
    UNSUBSCRIBE_BLOCK: {
        data: {
            subscribed: false,
        },
    },
    SUBSCRIBE_ADDRESS: {
        data: {
            subscribed: true,
        },
    },
    UNSUBSCRIBE_ADDRESS: {
        data: {
            subscribed: false,
        },
    },
    PUSH_TRANSACTION: {
        data: {
            error: 'Bad Request',
            message:
                'transaction read error RawCborDecodeError [DecoderErrorDeserialiseFailure "Byron Tx" (DeserialiseFailure 0 "end of input"),DecoderErrorDeserialiseFailure "Shelley Tx" (DeserialiseFailure 0 "end of input"),DecoderErrorDeserialiseFailure "Shelley Tx" (DeserialiseFailure 0 "end of input"),DecoderErrorDeserialiseFailure "Shelley Tx" (DeserialiseFailure 0 "end of input")]',
            status_code: 400,
        },
    },
    ESTIMATE_FEE: {
        data: {
            lovelacePerByte: '44',
        },
    },
};
