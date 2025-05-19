import {
    Account,
    Asset,
    Memo,
    Networks,
    Operation,
    TransactionBuilder,
} from '@stellar/stellar-sdk';
export const fixtures = {
    toStroops: [
        {
            description: 'max value',
            input: '922337203685.4775807',
            expectedOutput: '9223372036854775807',
        },
        {
            description: 'min value',
            input: '0',
            expectedOutput: '0',
        },
    ],
    transformTransaction: [
        {
            description: 'transaction contains multiple operations',
            input: {
                descriptor: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                tx: {
                    _links: {
                        self: {
                            href: 'https://horizon.stellar.org/transactions/0d9ebb6dc26097e5024994477dcbfdea2df7ba41caa204e885a85b51f10e30ef',
                        },
                        account: {
                            href: 'https://horizon.stellar.org/accounts/GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                        },
                        ledger: {
                            href: 'https://horizon.stellar.org/ledgers/56802294',
                        },
                        operations: {
                            href: 'https://horizon.stellar.org/transactions/0d9ebb6dc26097e5024994477dcbfdea2df7ba41caa204e885a85b51f10e30ef/operations{?cursor,limit,order}',
                            templated: true,
                        },
                        effects: {
                            href: 'https://horizon.stellar.org/transactions/0d9ebb6dc26097e5024994477dcbfdea2df7ba41caa204e885a85b51f10e30ef/effects{?cursor,limit,order}',
                            templated: true,
                        },
                        precedes: {
                            href: 'https://horizon.stellar.org/transactions?order=asc\u0026cursor=243963995068129280',
                        },
                        succeeds: {
                            href: 'https://horizon.stellar.org/transactions?order=desc\u0026cursor=243963995068129280',
                        },
                        transaction: {
                            href: 'https://horizon.stellar.org/transactions/0d9ebb6dc26097e5024994477dcbfdea2df7ba41caa204e885a85b51f10e30ef',
                        },
                    },
                    id: '0d9ebb6dc26097e5024994477dcbfdea2df7ba41caa204e885a85b51f10e30ef',
                    paging_token: '243963995068129280',
                    successful: true,
                    hash: '0d9ebb6dc26097e5024994477dcbfdea2df7ba41caa204e885a85b51f10e30ef',
                    ledger_attr: 56802294,
                    created_at: '2025-04-27T02:25:26Z',
                    source_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    source_account_sequence: '243959279193686018',
                    fee_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    fee_charged: '200',
                    max_fee: '200',
                    operation_count: 2,
                    envelope_xdr:
                        'AAAAAgAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAMgDYresAAAAAgAAAAEAAAAAAAAAAAAAAABoDZa/AAAAAAAAAAIAAAAAAAAAAQAAAAClce2rJgP9P0C7zs0Qe2D+Wki2mFamYVUyfv40BYsREAAAAAAAAAAAAAGGoAAAAAAAAAABAAAAAKVx7asmA/0/QLvOzRB7YP5aSLaYVqZhVTJ+/jQFixEQAAAAAAAAAAAAAw1AAAAAAAAAAAGDncpzAAAAQDyYvRst69t/8xyG1x/7GAIOwBaBiQDoXVW9NPqQcm7yCI2p/v4sCHHKkwwgUN7m5ANdhI7Dpytpn7opp6WJIg0=',
                    result_xdr: 'AAAAAAAAAMgAAAAAAAAAAgAAAAAAAAABAAAAAAAAAAAAAAABAAAAAAAAAAA=',
                    fee_meta_xdr:
                        'AAAAAgAAAAMDYre/AAAAAAAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAAABycK4A2K3rAAAAAEAAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAANit78AAAAAaA19lAAAAAAAAAABA2K79gAAAAAAAAAAfb6CIo5dX+M9ULQYoCWJ3CCnpN9d/x91oBiX/oOdynMAAAAAAcnB8ANit6wAAAABAAAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAwAAAAADYre/AAAAAGgNfZQAAAAA',
                    memo_type: 'none',
                    signatures: [
                        'PJi9Gy3r23/zHIbXH/sYAg7AFoGJAOhdVb00+pBybvIIjan+/iwIccqTDCBQ3ubkA12EjsOnK2mfuimnpYkiDQ==',
                    ],
                    preconditions: {
                        timebounds: {
                            min_time: '0',
                            max_time: '1745721023',
                        },
                    },
                },
            },
            expectedOutput: {
                amount: '0',
                blockHeight: 56802294,
                blockTime: 1745720726,
                details: {
                    size: 0,
                    totalInput: '0',
                    totalOutput: '0',
                    vin: [],
                    vout: [],
                },
                fee: '200',
                feeRate: undefined,
                internalTransfers: [],
                stellarSpecific: {
                    memo: undefined,
                },
                targets: [],
                tokens: [],
                txid: '0d9ebb6dc26097e5024994477dcbfdea2df7ba41caa204e885a85b51f10e30ef',
                type: 'unknown',
            },
        },
        {
            description:
                'transaction contains a create account operation, and descriptor is the sender',
            input: {
                descriptor: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                tx: {
                    _links: {
                        self: {
                            href: 'https://horizon.stellar.org/transactions/c1cb108cd781a4a1d0ac81228cc0423b7df5753dfba22e421aa7315fd928d027',
                        },
                        account: {
                            href: 'https://horizon.stellar.org/accounts/GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                        },
                        ledger: {
                            href: 'https://horizon.stellar.org/ledgers/56805028',
                        },
                        operations: {
                            href: 'https://horizon.stellar.org/transactions/c1cb108cd781a4a1d0ac81228cc0423b7df5753dfba22e421aa7315fd928d027/operations{?cursor,limit,order}',
                            templated: true,
                        },
                        effects: {
                            href: 'https://horizon.stellar.org/transactions/c1cb108cd781a4a1d0ac81228cc0423b7df5753dfba22e421aa7315fd928d027/effects{?cursor,limit,order}',
                            templated: true,
                        },
                        precedes: {
                            href: 'https://horizon.stellar.org/transactions?order=asc\u0026cursor=243975737508446208',
                        },
                        succeeds: {
                            href: 'https://horizon.stellar.org/transactions?order=desc\u0026cursor=243975737508446208',
                        },
                        transaction: {
                            href: 'https://horizon.stellar.org/transactions/c1cb108cd781a4a1d0ac81228cc0423b7df5753dfba22e421aa7315fd928d027',
                        },
                    },
                    id: 'c1cb108cd781a4a1d0ac81228cc0423b7df5753dfba22e421aa7315fd928d027',
                    paging_token: '243975737508446208',
                    successful: true,
                    hash: 'c1cb108cd781a4a1d0ac81228cc0423b7df5753dfba22e421aa7315fd928d027',
                    ledger_attr: 56805028,
                    created_at: '2025-04-27T06:43:01Z',
                    source_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    source_account_sequence: '243959279193686031',
                    fee_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    fee_charged: '100',
                    max_fee: '100',
                    operation_count: 1,
                    envelope_xdr:
                        'AAAAAgAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAGQDYresAAAADwAAAAEAAAAAAAAAAAAAAABoDdMfAAAAAAAAAAEAAAAAAAAAAAAAAABRYKF6YlkNcP7LCFoaqvrzoUTL8w/dA4Wqq4XnX10LLwAAAAAAmh0gAAAAAAAAAAGDncpzAAAAQDwUROhXQLtJgAvMqbAgUaYtntJZgEGqE9ZUw7fdR/pZaG71EucS+EKlGEX5iYe1yYCczmp04RXxuc9a301zMw8=',
                    result_xdr: 'AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAA=',
                    fee_meta_xdr:
                        'AAAAAgAAAAMDYsaYAAAAAAAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAAABqnVwA2K3rAAAAA4AAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAANixpgAAAAAaA3RsgAAAAAAAAABA2LGpAAAAAAAAAAAfb6CIo5dX+M9ULQYoCWJ3CCnpN9d/x91oBiX/oOdynMAAAAAAap1DANit6wAAAAOAAAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAwAAAAADYsaYAAAAAGgN0bIAAAAA',
                    memo_type: 'none',
                    signatures: [
                        'PBRE6FdAu0mAC8ypsCBRpi2e0lmAQaoT1lTDt91H+llobvUS5xL4QqUYRfmJh7XJgJzOanThFfG5z1rfTXMzDw==',
                    ],
                    preconditions: {
                        timebounds: {
                            min_time: '0',
                            max_time: '1745736479',
                        },
                    },
                },
            },
            expectedOutput: {
                amount: '10100000',
                blockHeight: 56805028,
                blockTime: 1745736181,
                details: {
                    size: 0,
                    totalInput: '10100000',
                    totalOutput: '10100000',
                    vin: [
                        {
                            addresses: ['GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4'],
                            isAddress: true,
                            n: 0,
                            value: '10100000',
                        },
                    ],
                    vout: [
                        {
                            addresses: ['GBIWBIL2MJMQ24H6ZMEFUGVK7LZ2CRGL6MH52A4FVKVYLZ27LUFS63UU'],
                            isAddress: true,
                            n: 0,
                            value: '10100000',
                        },
                    ],
                },
                fee: '100',
                feeRate: undefined,
                internalTransfers: [],
                stellarSpecific: {
                    memo: undefined,
                },
                targets: [
                    {
                        addresses: ['GBIWBIL2MJMQ24H6ZMEFUGVK7LZ2CRGL6MH52A4FVKVYLZ27LUFS63UU'],
                        amount: '10100000',
                        isAddress: true,
                        n: 0,
                    },
                ],
                tokens: [],
                txid: 'c1cb108cd781a4a1d0ac81228cc0423b7df5753dfba22e421aa7315fd928d027',
                type: 'sent',
            },
        },
        {
            description:
                'transaction contains a create account operation, and descriptor is the receiver',
            input: {
                descriptor: 'GBIWBIL2MJMQ24H6ZMEFUGVK7LZ2CRGL6MH52A4FVKVYLZ27LUFS63UU',
                tx: {
                    _links: {
                        self: {
                            href: 'https://horizon.stellar.org/transactions/c1cb108cd781a4a1d0ac81228cc0423b7df5753dfba22e421aa7315fd928d027',
                        },
                        account: {
                            href: 'https://horizon.stellar.org/accounts/GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                        },
                        ledger: {
                            href: 'https://horizon.stellar.org/ledgers/56805028',
                        },
                        operations: {
                            href: 'https://horizon.stellar.org/transactions/c1cb108cd781a4a1d0ac81228cc0423b7df5753dfba22e421aa7315fd928d027/operations{?cursor,limit,order}',
                            templated: true,
                        },
                        effects: {
                            href: 'https://horizon.stellar.org/transactions/c1cb108cd781a4a1d0ac81228cc0423b7df5753dfba22e421aa7315fd928d027/effects{?cursor,limit,order}',
                            templated: true,
                        },
                        precedes: {
                            href: 'https://horizon.stellar.org/transactions?order=asc\u0026cursor=243975737508446208',
                        },
                        succeeds: {
                            href: 'https://horizon.stellar.org/transactions?order=desc\u0026cursor=243975737508446208',
                        },
                        transaction: {
                            href: 'https://horizon.stellar.org/transactions/c1cb108cd781a4a1d0ac81228cc0423b7df5753dfba22e421aa7315fd928d027',
                        },
                    },
                    id: 'c1cb108cd781a4a1d0ac81228cc0423b7df5753dfba22e421aa7315fd928d027',
                    paging_token: '243975737508446208',
                    successful: true,
                    hash: 'c1cb108cd781a4a1d0ac81228cc0423b7df5753dfba22e421aa7315fd928d027',
                    ledger_attr: 56805028,
                    created_at: '2025-04-27T06:43:01Z',
                    source_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    source_account_sequence: '243959279193686031',
                    fee_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    fee_charged: '100',
                    max_fee: '100',
                    operation_count: 1,
                    envelope_xdr:
                        'AAAAAgAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAGQDYresAAAADwAAAAEAAAAAAAAAAAAAAABoDdMfAAAAAAAAAAEAAAAAAAAAAAAAAABRYKF6YlkNcP7LCFoaqvrzoUTL8w/dA4Wqq4XnX10LLwAAAAAAmh0gAAAAAAAAAAGDncpzAAAAQDwUROhXQLtJgAvMqbAgUaYtntJZgEGqE9ZUw7fdR/pZaG71EucS+EKlGEX5iYe1yYCczmp04RXxuc9a301zMw8=',
                    result_xdr: 'AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAA=',
                    fee_meta_xdr:
                        'AAAAAgAAAAMDYsaYAAAAAAAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAAABqnVwA2K3rAAAAA4AAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAANixpgAAAAAaA3RsgAAAAAAAAABA2LGpAAAAAAAAAAAfb6CIo5dX+M9ULQYoCWJ3CCnpN9d/x91oBiX/oOdynMAAAAAAap1DANit6wAAAAOAAAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAwAAAAADYsaYAAAAAGgN0bIAAAAA',
                    memo_type: 'none',
                    signatures: [
                        'PBRE6FdAu0mAC8ypsCBRpi2e0lmAQaoT1lTDt91H+llobvUS5xL4QqUYRfmJh7XJgJzOanThFfG5z1rfTXMzDw==',
                    ],
                    preconditions: {
                        timebounds: {
                            min_time: '0',
                            max_time: '1745736479',
                        },
                    },
                },
            },
            expectedOutput: {
                amount: '10100000',
                blockHeight: 56805028,
                blockTime: 1745736181,
                details: {
                    size: 0,
                    totalInput: '10100000',
                    totalOutput: '10100000',
                    vin: [
                        {
                            addresses: ['GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4'],
                            isAddress: true,
                            n: 0,
                            value: '10100000',
                        },
                    ],
                    vout: [
                        {
                            addresses: ['GBIWBIL2MJMQ24H6ZMEFUGVK7LZ2CRGL6MH52A4FVKVYLZ27LUFS63UU'],
                            isAddress: true,
                            n: 0,
                            value: '10100000',
                        },
                    ],
                },
                fee: '100',
                feeRate: undefined,
                internalTransfers: [],
                stellarSpecific: {
                    memo: undefined,
                },
                targets: [
                    {
                        addresses: ['GBIWBIL2MJMQ24H6ZMEFUGVK7LZ2CRGL6MH52A4FVKVYLZ27LUFS63UU'],
                        amount: '10100000',
                        isAddress: true,
                        n: 0,
                    },
                ],
                tokens: [],
                txid: 'c1cb108cd781a4a1d0ac81228cc0423b7df5753dfba22e421aa7315fd928d027',
                type: 'recv',
            },
        },
        {
            description:
                'transaction contains a create account operation, and descriptor is the sender (muxed)',
            input: {
                descriptor: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                tx: {
                    _links: {
                        self: {
                            href: 'https://horizon.stellar.org/transactions/471eab5508689da7e4ce3379702a3e21de81f7e1cd649df26e7f1999e618b462',
                        },
                        account: {
                            href: 'https://horizon.stellar.org/accounts/GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                        },
                        ledger: {
                            href: 'https://horizon.stellar.org/ledgers/56806028',
                        },
                        operations: {
                            href: 'https://horizon.stellar.org/transactions/471eab5508689da7e4ce3379702a3e21de81f7e1cd649df26e7f1999e618b462/operations{?cursor,limit,order}',
                            templated: true,
                        },
                        effects: {
                            href: 'https://horizon.stellar.org/transactions/471eab5508689da7e4ce3379702a3e21de81f7e1cd649df26e7f1999e618b462/effects{?cursor,limit,order}',
                            templated: true,
                        },
                        precedes: {
                            href: 'https://horizon.stellar.org/transactions?order=asc\u0026cursor=243980032476053504',
                        },
                        succeeds: {
                            href: 'https://horizon.stellar.org/transactions?order=desc\u0026cursor=243980032476053504',
                        },
                        transaction: {
                            href: 'https://horizon.stellar.org/transactions/471eab5508689da7e4ce3379702a3e21de81f7e1cd649df26e7f1999e618b462',
                        },
                    },
                    id: '471eab5508689da7e4ce3379702a3e21de81f7e1cd649df26e7f1999e618b462',
                    paging_token: '243980032476053504',
                    successful: true,
                    hash: '471eab5508689da7e4ce3379702a3e21de81f7e1cd649df26e7f1999e618b462',
                    ledger_attr: 56806028,
                    created_at: '2025-04-27T08:16:23Z',
                    source_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    account_muxed:
                        'MB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHGAAAAAAAAAAAAGJE2',
                    account_muxed_id: '1',
                    source_account_sequence: '243959279193686036',
                    fee_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    fee_account_muxed:
                        'MB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHGAAAAAAAAAAAAGJE2',
                    fee_account_muxed_id: '1',
                    fee_charged: '100',
                    max_fee: '100',
                    operation_count: 1,
                    envelope_xdr:
                        'AAAAAgAAAQAAAAAAAAAAAX2+giKOXV/jPVC0GKAlidwgp6TfXf8fdaAYl/6DncpzAAAAZANit6wAAAAUAAAAAQAAAAAAAAAAAAAAAGgN6PwAAAAAAAAAAQAAAAAAAAAAAAAAAFFgoXpiWQ1w/ssIWhqq+vOhRMvzD90DhaqrhedfXQsvAAAAAACn2MAAAAAAAAAAAYOdynMAAABAgyzUezkULDG5zvUpoiFz4xGx0GA97HBJXpqMA+do3UwQ6/AmDc3Nw1yGSHkoi5cnL/ReuAYZ22jISDChm9hzDA==',
                    result_xdr: 'AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAA=',
                    fee_meta_xdr:
                        'AAAAAgAAAAMDYsp2AAAAAAAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAAABu8L/A2K3rAAAABMAAAABAAAAAAAAAAAAAAAA/wAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAANiyhIAAAAAaA3lKwAAAAAAAAABA2LKjAAAAAAAAAAAfb6CIo5dX+M9ULQYoCWJ3CCnpN9d/x91oBiX/oOdynMAAAAAAbvCmwNit6wAAAATAAAAAQAAAAAAAAAAAAAAAP8AAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAwAAAAADYsoSAAAAAGgN5SsAAAAA',
                    memo_type: 'none',
                    signatures: [
                        'gyzUezkULDG5zvUpoiFz4xGx0GA97HBJXpqMA+do3UwQ6/AmDc3Nw1yGSHkoi5cnL/ReuAYZ22jISDChm9hzDA==',
                    ],
                    preconditions: {
                        timebounds: {
                            min_time: '0',
                            max_time: '1745742076',
                        },
                    },
                },
            },
            expectedOutput: {
                amount: '11000000',
                blockHeight: 56806028,
                blockTime: 1745741783,
                details: {
                    size: 0,
                    totalInput: '11000000',
                    totalOutput: '11000000',
                    vin: [
                        {
                            addresses: ['GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4'],
                            isAddress: true,
                            n: 0,
                            value: '11000000',
                        },
                    ],
                    vout: [
                        {
                            addresses: ['GBIWBIL2MJMQ24H6ZMEFUGVK7LZ2CRGL6MH52A4FVKVYLZ27LUFS63UU'],
                            isAddress: true,
                            n: 0,
                            value: '11000000',
                        },
                    ],
                },
                fee: '100',
                feeRate: undefined,
                internalTransfers: [],
                stellarSpecific: {
                    memo: undefined,
                },
                targets: [
                    {
                        addresses: ['GBIWBIL2MJMQ24H6ZMEFUGVK7LZ2CRGL6MH52A4FVKVYLZ27LUFS63UU'],
                        amount: '11000000',
                        isAddress: true,
                        n: 0,
                    },
                ],
                tokens: [],
                txid: '471eab5508689da7e4ce3379702a3e21de81f7e1cd649df26e7f1999e618b462',
                type: 'sent',
            },
        },
        {
            description:
                'transaction contains a create account operation, and descriptor is the receiver (muxed)',
            input: {
                descriptor: 'GBIWBIL2MJMQ24H6ZMEFUGVK7LZ2CRGL6MH52A4FVKVYLZ27LUFS63UU',
                tx: {
                    _links: {
                        self: {
                            href: 'https://horizon.stellar.org/transactions/471eab5508689da7e4ce3379702a3e21de81f7e1cd649df26e7f1999e618b462',
                        },
                        account: {
                            href: 'https://horizon.stellar.org/accounts/GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                        },
                        ledger: {
                            href: 'https://horizon.stellar.org/ledgers/56806028',
                        },
                        operations: {
                            href: 'https://horizon.stellar.org/transactions/471eab5508689da7e4ce3379702a3e21de81f7e1cd649df26e7f1999e618b462/operations{?cursor,limit,order}',
                            templated: true,
                        },
                        effects: {
                            href: 'https://horizon.stellar.org/transactions/471eab5508689da7e4ce3379702a3e21de81f7e1cd649df26e7f1999e618b462/effects{?cursor,limit,order}',
                            templated: true,
                        },
                        precedes: {
                            href: 'https://horizon.stellar.org/transactions?order=asc\u0026cursor=243980032476053504',
                        },
                        succeeds: {
                            href: 'https://horizon.stellar.org/transactions?order=desc\u0026cursor=243980032476053504',
                        },
                        transaction: {
                            href: 'https://horizon.stellar.org/transactions/471eab5508689da7e4ce3379702a3e21de81f7e1cd649df26e7f1999e618b462',
                        },
                    },
                    id: '471eab5508689da7e4ce3379702a3e21de81f7e1cd649df26e7f1999e618b462',
                    paging_token: '243980032476053504',
                    successful: true,
                    hash: '471eab5508689da7e4ce3379702a3e21de81f7e1cd649df26e7f1999e618b462',
                    ledger_attr: 56806028,
                    created_at: '2025-04-27T08:16:23Z',
                    source_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    account_muxed:
                        'MB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHGAAAAAAAAAAAAGJE2',
                    account_muxed_id: '1',
                    source_account_sequence: '243959279193686036',
                    fee_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    fee_account_muxed:
                        'MB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHGAAAAAAAAAAAAGJE2',
                    fee_account_muxed_id: '1',
                    fee_charged: '100',
                    max_fee: '100',
                    operation_count: 1,
                    envelope_xdr:
                        'AAAAAgAAAQAAAAAAAAAAAX2+giKOXV/jPVC0GKAlidwgp6TfXf8fdaAYl/6DncpzAAAAZANit6wAAAAUAAAAAQAAAAAAAAAAAAAAAGgN6PwAAAAAAAAAAQAAAAAAAAAAAAAAAFFgoXpiWQ1w/ssIWhqq+vOhRMvzD90DhaqrhedfXQsvAAAAAACn2MAAAAAAAAAAAYOdynMAAABAgyzUezkULDG5zvUpoiFz4xGx0GA97HBJXpqMA+do3UwQ6/AmDc3Nw1yGSHkoi5cnL/ReuAYZ22jISDChm9hzDA==',
                    result_xdr: 'AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAA=',
                    fee_meta_xdr:
                        'AAAAAgAAAAMDYsp2AAAAAAAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAAABu8L/A2K3rAAAABMAAAABAAAAAAAAAAAAAAAA/wAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAANiyhIAAAAAaA3lKwAAAAAAAAABA2LKjAAAAAAAAAAAfb6CIo5dX+M9ULQYoCWJ3CCnpN9d/x91oBiX/oOdynMAAAAAAbvCmwNit6wAAAATAAAAAQAAAAAAAAAAAAAAAP8AAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAwAAAAADYsoSAAAAAGgN5SsAAAAA',
                    memo_type: 'none',
                    signatures: [
                        'gyzUezkULDG5zvUpoiFz4xGx0GA97HBJXpqMA+do3UwQ6/AmDc3Nw1yGSHkoi5cnL/ReuAYZ22jISDChm9hzDA==',
                    ],
                    preconditions: {
                        timebounds: {
                            min_time: '0',
                            max_time: '1745742076',
                        },
                    },
                },
            },
            expectedOutput: {
                amount: '11000000',
                blockHeight: 56806028,
                blockTime: 1745741783,
                details: {
                    size: 0,
                    totalInput: '11000000',
                    totalOutput: '11000000',
                    vin: [
                        {
                            addresses: ['GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4'],
                            isAddress: true,
                            n: 0,
                            value: '11000000',
                        },
                    ],
                    vout: [
                        {
                            addresses: ['GBIWBIL2MJMQ24H6ZMEFUGVK7LZ2CRGL6MH52A4FVKVYLZ27LUFS63UU'],
                            isAddress: true,
                            n: 0,
                            value: '11000000',
                        },
                    ],
                },
                fee: '100',
                feeRate: undefined,
                internalTransfers: [],
                stellarSpecific: {
                    memo: undefined,
                },
                targets: [
                    {
                        addresses: ['GBIWBIL2MJMQ24H6ZMEFUGVK7LZ2CRGL6MH52A4FVKVYLZ27LUFS63UU'],
                        amount: '11000000',
                        isAddress: true,
                        n: 0,
                    },
                ],
                tokens: [],
                txid: '471eab5508689da7e4ce3379702a3e21de81f7e1cd649df26e7f1999e618b462',
                type: 'recv',
            },
        },
        {
            description:
                'transaction contains a payment operation, and the asset is native, the descriptor is the sender',
            input: {
                descriptor: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                tx: {
                    _links: {
                        self: {
                            href: 'https://horizon.stellar.org/transactions/093f6364077430ba40b03010aecea9ef2cece73e55a319e62b50ba55336e3d7e',
                        },
                        account: {
                            href: 'https://horizon.stellar.org/accounts/GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                        },
                        ledger: {
                            href: 'https://horizon.stellar.org/ledgers/56805016',
                        },
                        operations: {
                            href: 'https://horizon.stellar.org/transactions/093f6364077430ba40b03010aecea9ef2cece73e55a319e62b50ba55336e3d7e/operations{?cursor,limit,order}',
                            templated: true,
                        },
                        effects: {
                            href: 'https://horizon.stellar.org/transactions/093f6364077430ba40b03010aecea9ef2cece73e55a319e62b50ba55336e3d7e/effects{?cursor,limit,order}',
                            templated: true,
                        },
                        precedes: {
                            href: 'https://horizon.stellar.org/transactions?order=asc\u0026cursor=243975685968982016',
                        },
                        succeeds: {
                            href: 'https://horizon.stellar.org/transactions?order=desc\u0026cursor=243975685968982016',
                        },
                        transaction: {
                            href: 'https://horizon.stellar.org/transactions/093f6364077430ba40b03010aecea9ef2cece73e55a319e62b50ba55336e3d7e',
                        },
                    },
                    id: '093f6364077430ba40b03010aecea9ef2cece73e55a319e62b50ba55336e3d7e',
                    paging_token: '243975685968982016',
                    successful: true,
                    hash: '093f6364077430ba40b03010aecea9ef2cece73e55a319e62b50ba55336e3d7e',
                    ledger_attr: 56805016,
                    created_at: '2025-04-27T06:41:54Z',
                    source_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    source_account_sequence: '243959279193686030',
                    fee_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    fee_charged: '100',
                    max_fee: '100',
                    operation_count: 1,
                    envelope_xdr:
                        'AAAAAgAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAGQDYresAAAADgAAAAEAAAAAAAAAAAAAAABoDdLZAAAAAAAAAAEAAAAAAAAAAQAAAAClce2rJgP9P0C7zs0Qe2D+Wki2mFamYVUyfv40BYsREAAAAAAAAAAAABMS0AAAAAAAAAABg53KcwAAAECkj6EGkxsHs/DRFpMjsdjJ2PKuxQDtXcEA/MYnRkAToagh4oguzu0r7SJkFqMoF6v/GDyEo4FGTFOuM7n65kQH',
                    result_xdr: 'AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAA=',
                    fee_meta_xdr:
                        'AAAAAgAAAAMDYrzZAAAAAAAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAAABvYikA2K3rAAAAA0AAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAANivNkAAAAAaA2akQAAAAAAAAABA2LGmAAAAAAAAAAAfb6CIo5dX+M9ULQYoCWJ3CCnpN9d/x91oBiX/oOdynMAAAAAAb2IQANit6wAAAANAAAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAwAAAAADYrzZAAAAAGgNmpEAAAAA',
                    memo_type: 'none',
                    signatures: [
                        'pI+hBpMbB7Pw0RaTI7HYydjyrsUA7V3BAPzGJ0ZAE6GoIeKILs7tK+0iZBajKBer/xg8hKOBRkxTrjO5+uZEBw==',
                    ],
                    preconditions: {
                        timebounds: {
                            min_time: '0',
                            max_time: '1745736409',
                        },
                    },
                },
            },
            expectedOutput: {
                amount: '1250000',
                blockHeight: 56805016,
                blockTime: 1745736114,
                details: {
                    size: 0,
                    totalInput: '1250000',
                    totalOutput: '1250000',
                    vin: [
                        {
                            addresses: ['GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4'],
                            isAddress: true,
                            n: 0,
                            value: '1250000',
                        },
                    ],
                    vout: [
                        {
                            addresses: ['GCSXD3NLEYB72P2AXPHM2ED3MD7FUSFWTBLKMYKVGJ7P4NAFRMIRA74Z'],
                            isAddress: true,
                            n: 0,
                            value: '1250000',
                        },
                    ],
                },
                fee: '100',
                feeRate: undefined,
                internalTransfers: [],
                stellarSpecific: {
                    memo: undefined,
                },
                targets: [
                    {
                        addresses: ['GCSXD3NLEYB72P2AXPHM2ED3MD7FUSFWTBLKMYKVGJ7P4NAFRMIRA74Z'],
                        amount: '1250000',
                        isAddress: true,
                        n: 0,
                    },
                ],
                tokens: [],
                txid: '093f6364077430ba40b03010aecea9ef2cece73e55a319e62b50ba55336e3d7e',
                type: 'sent',
            },
        },
        {
            description:
                'transaction contains a payment operation, and the asset is native, the descriptor is the receiver',
            input: {
                descriptor: 'GCSXD3NLEYB72P2AXPHM2ED3MD7FUSFWTBLKMYKVGJ7P4NAFRMIRA74Z',
                tx: {
                    _links: {
                        self: {
                            href: 'https://horizon.stellar.org/transactions/093f6364077430ba40b03010aecea9ef2cece73e55a319e62b50ba55336e3d7e',
                        },
                        account: {
                            href: 'https://horizon.stellar.org/accounts/GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                        },
                        ledger: {
                            href: 'https://horizon.stellar.org/ledgers/56805016',
                        },
                        operations: {
                            href: 'https://horizon.stellar.org/transactions/093f6364077430ba40b03010aecea9ef2cece73e55a319e62b50ba55336e3d7e/operations{?cursor,limit,order}',
                            templated: true,
                        },
                        effects: {
                            href: 'https://horizon.stellar.org/transactions/093f6364077430ba40b03010aecea9ef2cece73e55a319e62b50ba55336e3d7e/effects{?cursor,limit,order}',
                            templated: true,
                        },
                        precedes: {
                            href: 'https://horizon.stellar.org/transactions?order=asc\u0026cursor=243975685968982016',
                        },
                        succeeds: {
                            href: 'https://horizon.stellar.org/transactions?order=desc\u0026cursor=243975685968982016',
                        },
                        transaction: {
                            href: 'https://horizon.stellar.org/transactions/093f6364077430ba40b03010aecea9ef2cece73e55a319e62b50ba55336e3d7e',
                        },
                    },
                    id: '093f6364077430ba40b03010aecea9ef2cece73e55a319e62b50ba55336e3d7e',
                    paging_token: '243975685968982016',
                    successful: true,
                    hash: '093f6364077430ba40b03010aecea9ef2cece73e55a319e62b50ba55336e3d7e',
                    ledger_attr: 56805016,
                    created_at: '2025-04-27T06:41:54Z',
                    source_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    source_account_sequence: '243959279193686030',
                    fee_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    fee_charged: '100',
                    max_fee: '100',
                    operation_count: 1,
                    envelope_xdr:
                        'AAAAAgAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAGQDYresAAAADgAAAAEAAAAAAAAAAAAAAABoDdLZAAAAAAAAAAEAAAAAAAAAAQAAAAClce2rJgP9P0C7zs0Qe2D+Wki2mFamYVUyfv40BYsREAAAAAAAAAAAABMS0AAAAAAAAAABg53KcwAAAECkj6EGkxsHs/DRFpMjsdjJ2PKuxQDtXcEA/MYnRkAToagh4oguzu0r7SJkFqMoF6v/GDyEo4FGTFOuM7n65kQH',
                    result_xdr: 'AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAA=',
                    fee_meta_xdr:
                        'AAAAAgAAAAMDYrzZAAAAAAAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAAABvYikA2K3rAAAAA0AAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAANivNkAAAAAaA2akQAAAAAAAAABA2LGmAAAAAAAAAAAfb6CIo5dX+M9ULQYoCWJ3CCnpN9d/x91oBiX/oOdynMAAAAAAb2IQANit6wAAAANAAAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAwAAAAADYrzZAAAAAGgNmpEAAAAA',
                    memo_type: 'none',
                    signatures: [
                        'pI+hBpMbB7Pw0RaTI7HYydjyrsUA7V3BAPzGJ0ZAE6GoIeKILs7tK+0iZBajKBer/xg8hKOBRkxTrjO5+uZEBw==',
                    ],
                    preconditions: {
                        timebounds: {
                            min_time: '0',
                            max_time: '1745736409',
                        },
                    },
                },
            },
            expectedOutput: {
                amount: '1250000',
                blockHeight: 56805016,
                blockTime: 1745736114,
                details: {
                    size: 0,
                    totalInput: '1250000',
                    totalOutput: '1250000',
                    vin: [
                        {
                            addresses: ['GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4'],
                            isAddress: true,
                            n: 0,
                            value: '1250000',
                        },
                    ],
                    vout: [
                        {
                            addresses: ['GCSXD3NLEYB72P2AXPHM2ED3MD7FUSFWTBLKMYKVGJ7P4NAFRMIRA74Z'],
                            isAddress: true,
                            n: 0,
                            value: '1250000',
                        },
                    ],
                },
                fee: '100',
                feeRate: undefined,
                internalTransfers: [],
                stellarSpecific: {
                    memo: undefined,
                },
                targets: [
                    {
                        addresses: ['GCSXD3NLEYB72P2AXPHM2ED3MD7FUSFWTBLKMYKVGJ7P4NAFRMIRA74Z'],
                        amount: '1250000',
                        isAddress: true,
                        n: 0,
                    },
                ],
                tokens: [],
                txid: '093f6364077430ba40b03010aecea9ef2cece73e55a319e62b50ba55336e3d7e',
                type: 'recv',
            },
        },
        {
            description:
                'transaction contains a payment operation, and the asset is native, the descriptor is the sender (muxed)',
            input: {
                descriptor: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                tx: {
                    _links: {
                        self: {
                            href: 'https://horizon.stellar.org/transactions/25aba500d4618bdcca0f0b483db73a9c817e19763361a5d8b4e4d44827e0087a',
                        },
                        account: {
                            href: 'https://horizon.stellar.org/accounts/GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                        },
                        ledger: {
                            href: 'https://horizon.stellar.org/ledgers/56805906',
                        },
                        operations: {
                            href: 'https://horizon.stellar.org/transactions/25aba500d4618bdcca0f0b483db73a9c817e19763361a5d8b4e4d44827e0087a/operations{?cursor,limit,order}',
                            templated: true,
                        },
                        effects: {
                            href: 'https://horizon.stellar.org/transactions/25aba500d4618bdcca0f0b483db73a9c817e19763361a5d8b4e4d44827e0087a/effects{?cursor,limit,order}',
                            templated: true,
                        },
                        precedes: {
                            href: 'https://horizon.stellar.org/transactions?order=asc\u0026cursor=243979508489850880',
                        },
                        succeeds: {
                            href: 'https://horizon.stellar.org/transactions?order=desc\u0026cursor=243979508489850880',
                        },
                        transaction: {
                            href: 'https://horizon.stellar.org/transactions/25aba500d4618bdcca0f0b483db73a9c817e19763361a5d8b4e4d44827e0087a',
                        },
                    },
                    id: '25aba500d4618bdcca0f0b483db73a9c817e19763361a5d8b4e4d44827e0087a',
                    paging_token: '243979508489850880',
                    successful: true,
                    hash: '25aba500d4618bdcca0f0b483db73a9c817e19763361a5d8b4e4d44827e0087a',
                    ledger_attr: 56805906,
                    created_at: '2025-04-27T08:04:59Z',
                    source_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    source_account_sequence: '243959279193686035',
                    fee_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    fee_charged: '100',
                    max_fee: '100',
                    operation_count: 1,
                    envelope_xdr:
                        'AAAAAgAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAGQDYresAAAAEwAAAAEAAAAAAAAAAAAAAABoDeZRAAAAAAAAAAEAAAABAAABAAAAAAAAAAABfb6CIo5dX+M9ULQYoCWJ3CCnpN9d/x91oBiX/oOdynMAAAABAAABAAAAAAAAAAABpXHtqyYD/T9Au87NEHtg/lpItphWpmFVMn7+NAWLERAAAAAAAAAAAAABhqAAAAAAAAAAAYOdynMAAABAD6Eq7GsodO/jgzKlXgzYoNpVOpDEaJTdiiXP4alqOpgXkaE4OkZdYyi9nuejDMEP6BxTNLOXGghl9aNDaqKyDQ==',
                    result_xdr: 'AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAA=',
                    fee_meta_xdr:
                        'AAAAAgAAAAMDYsmtAAAAAAAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAAABEFbAA2K3rAAAABIAAAABAAAAAAAAAAAAAAAA/wAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAANiya0AAAAAaA3i8AAAAAAAAAABA2LKEgAAAAAAAAAAfb6CIo5dX+M9ULQYoCWJ3CCnpN9d/x91oBiX/oOdynMAAAAAARBWXANit6wAAAASAAAAAQAAAAAAAAAAAAAAAP8AAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAwAAAAADYsmtAAAAAGgN4vAAAAAA',
                    memo_type: 'none',
                    signatures: [
                        'D6Eq7GsodO/jgzKlXgzYoNpVOpDEaJTdiiXP4alqOpgXkaE4OkZdYyi9nuejDMEP6BxTNLOXGghl9aNDaqKyDQ==',
                    ],
                    preconditions: {
                        timebounds: {
                            min_time: '0',
                            max_time: '1745741393',
                        },
                    },
                },
            },
            expectedOutput: {
                amount: '100000',
                blockHeight: 56805906,
                blockTime: 1745741099,
                details: {
                    size: 0,
                    totalInput: '100000',
                    totalOutput: '100000',
                    vin: [
                        {
                            addresses: ['GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4'],
                            isAddress: true,
                            n: 0,
                            value: '100000',
                        },
                    ],
                    vout: [
                        {
                            addresses: ['GCSXD3NLEYB72P2AXPHM2ED3MD7FUSFWTBLKMYKVGJ7P4NAFRMIRA74Z'],
                            isAddress: true,
                            n: 0,
                            value: '100000',
                        },
                    ],
                },
                fee: '100',
                feeRate: undefined,
                internalTransfers: [],
                stellarSpecific: {
                    memo: undefined,
                },
                targets: [
                    {
                        addresses: ['GCSXD3NLEYB72P2AXPHM2ED3MD7FUSFWTBLKMYKVGJ7P4NAFRMIRA74Z'],
                        amount: '100000',
                        isAddress: true,
                        n: 0,
                    },
                ],
                tokens: [],
                txid: '25aba500d4618bdcca0f0b483db73a9c817e19763361a5d8b4e4d44827e0087a',
                type: 'sent',
            },
        },
        {
            description:
                'transaction contains a payment operation, and the asset is native, the descriptor is the receiver (muxed)',
            input: {
                descriptor: 'GCSXD3NLEYB72P2AXPHM2ED3MD7FUSFWTBLKMYKVGJ7P4NAFRMIRA74Z',
                tx: {
                    _links: {
                        self: {
                            href: 'https://horizon.stellar.org/transactions/25aba500d4618bdcca0f0b483db73a9c817e19763361a5d8b4e4d44827e0087a',
                        },
                        account: {
                            href: 'https://horizon.stellar.org/accounts/GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                        },
                        ledger: {
                            href: 'https://horizon.stellar.org/ledgers/56805906',
                        },
                        operations: {
                            href: 'https://horizon.stellar.org/transactions/25aba500d4618bdcca0f0b483db73a9c817e19763361a5d8b4e4d44827e0087a/operations{?cursor,limit,order}',
                            templated: true,
                        },
                        effects: {
                            href: 'https://horizon.stellar.org/transactions/25aba500d4618bdcca0f0b483db73a9c817e19763361a5d8b4e4d44827e0087a/effects{?cursor,limit,order}',
                            templated: true,
                        },
                        precedes: {
                            href: 'https://horizon.stellar.org/transactions?order=asc\u0026cursor=243979508489850880',
                        },
                        succeeds: {
                            href: 'https://horizon.stellar.org/transactions?order=desc\u0026cursor=243979508489850880',
                        },
                        transaction: {
                            href: 'https://horizon.stellar.org/transactions/25aba500d4618bdcca0f0b483db73a9c817e19763361a5d8b4e4d44827e0087a',
                        },
                    },
                    id: '25aba500d4618bdcca0f0b483db73a9c817e19763361a5d8b4e4d44827e0087a',
                    paging_token: '243979508489850880',
                    successful: true,
                    hash: '25aba500d4618bdcca0f0b483db73a9c817e19763361a5d8b4e4d44827e0087a',
                    ledger_attr: 56805906,
                    created_at: '2025-04-27T08:04:59Z',
                    source_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    source_account_sequence: '243959279193686035',
                    fee_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    fee_charged: '100',
                    max_fee: '100',
                    operation_count: 1,
                    envelope_xdr:
                        'AAAAAgAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAGQDYresAAAAEwAAAAEAAAAAAAAAAAAAAABoDeZRAAAAAAAAAAEAAAABAAABAAAAAAAAAAABfb6CIo5dX+M9ULQYoCWJ3CCnpN9d/x91oBiX/oOdynMAAAABAAABAAAAAAAAAAABpXHtqyYD/T9Au87NEHtg/lpItphWpmFVMn7+NAWLERAAAAAAAAAAAAABhqAAAAAAAAAAAYOdynMAAABAD6Eq7GsodO/jgzKlXgzYoNpVOpDEaJTdiiXP4alqOpgXkaE4OkZdYyi9nuejDMEP6BxTNLOXGghl9aNDaqKyDQ==',
                    result_xdr: 'AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAA=',
                    fee_meta_xdr:
                        'AAAAAgAAAAMDYsmtAAAAAAAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAAABEFbAA2K3rAAAABIAAAABAAAAAAAAAAAAAAAA/wAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAANiya0AAAAAaA3i8AAAAAAAAAABA2LKEgAAAAAAAAAAfb6CIo5dX+M9ULQYoCWJ3CCnpN9d/x91oBiX/oOdynMAAAAAARBWXANit6wAAAASAAAAAQAAAAAAAAAAAAAAAP8AAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAwAAAAADYsmtAAAAAGgN4vAAAAAA',
                    memo_type: 'none',
                    signatures: [
                        'D6Eq7GsodO/jgzKlXgzYoNpVOpDEaJTdiiXP4alqOpgXkaE4OkZdYyi9nuejDMEP6BxTNLOXGghl9aNDaqKyDQ==',
                    ],
                    preconditions: {
                        timebounds: {
                            min_time: '0',
                            max_time: '1745741393',
                        },
                    },
                },
            },
            expectedOutput: {
                amount: '100000',
                blockHeight: 56805906,
                blockTime: 1745741099,
                details: {
                    size: 0,
                    totalInput: '100000',
                    totalOutput: '100000',
                    vin: [
                        {
                            addresses: ['GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4'],
                            isAddress: true,
                            n: 0,
                            value: '100000',
                        },
                    ],
                    vout: [
                        {
                            addresses: ['GCSXD3NLEYB72P2AXPHM2ED3MD7FUSFWTBLKMYKVGJ7P4NAFRMIRA74Z'],
                            isAddress: true,
                            n: 0,
                            value: '100000',
                        },
                    ],
                },
                fee: '100',
                feeRate: undefined,
                internalTransfers: [],
                stellarSpecific: {
                    memo: undefined,
                },
                targets: [
                    {
                        addresses: ['GCSXD3NLEYB72P2AXPHM2ED3MD7FUSFWTBLKMYKVGJ7P4NAFRMIRA74Z'],
                        amount: '100000',
                        isAddress: true,
                        n: 0,
                    },
                ],
                tokens: [],
                txid: '25aba500d4618bdcca0f0b483db73a9c817e19763361a5d8b4e4d44827e0087a',
                type: 'recv',
            },
        },
        {
            description: 'transaction contains a payment operation, but the asset is not native',
            input: {
                descriptor: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                tx: {
                    _links: {
                        self: {
                            href: 'https://horizon.stellar.org/transactions/29854b425e62081bbf845c2b10e8bdb525e3a3765d8ca53bc1a0bd0c88a0f265',
                        },
                        account: {
                            href: 'https://horizon.stellar.org/accounts/GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                        },
                        ledger: {
                            href: 'https://horizon.stellar.org/ledgers/56802308',
                        },
                        operations: {
                            href: 'https://horizon.stellar.org/transactions/29854b425e62081bbf845c2b10e8bdb525e3a3765d8ca53bc1a0bd0c88a0f265/operations{?cursor,limit,order}',
                            templated: true,
                        },
                        effects: {
                            href: 'https://horizon.stellar.org/transactions/29854b425e62081bbf845c2b10e8bdb525e3a3765d8ca53bc1a0bd0c88a0f265/effects{?cursor,limit,order}',
                            templated: true,
                        },
                        precedes: {
                            href: 'https://horizon.stellar.org/transactions?order=asc\u0026cursor=243964055197659136',
                        },
                        succeeds: {
                            href: 'https://horizon.stellar.org/transactions?order=desc\u0026cursor=243964055197659136',
                        },
                        transaction: {
                            href: 'https://horizon.stellar.org/transactions/29854b425e62081bbf845c2b10e8bdb525e3a3765d8ca53bc1a0bd0c88a0f265',
                        },
                    },
                    id: '29854b425e62081bbf845c2b10e8bdb525e3a3765d8ca53bc1a0bd0c88a0f265',
                    paging_token: '243964055197659136',
                    successful: true,
                    hash: '29854b425e62081bbf845c2b10e8bdb525e3a3765d8ca53bc1a0bd0c88a0f265',
                    ledger_attr: 56802308,
                    created_at: '2025-04-27T02:26:45Z',
                    source_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    source_account_sequence: '243959279193686019',
                    fee_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    fee_charged: '100',
                    max_fee: '100',
                    operation_count: 1,
                    envelope_xdr:
                        'AAAAAgAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAGQDYresAAAAAwAAAAEAAAAAAAAAAAAAAABoDZcMAAAAAAAAAAEAAAAAAAAAAQAAAAClce2rJgP9P0C7zs0Qe2D+Wki2mFamYVUyfv40BYsREAAAAAFVU0RDAAAAADuZETgO/piLoKiQDrHP5E82b32+lGvtB3JA9/Yk3xXFAAAAAAABhqAAAAAAAAAAAYOdynMAAABAlHIFUVI4zaeOWaxlSnbl1pucEZ32DsAvUssdqeSEB1eb2mlHlfy2xKx9DKQ4RD8/JgjgRAsW/Xp5bRzIWBrRDg==',
                    result_xdr: 'AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAA=',
                    fee_meta_xdr:
                        'AAAAAgAAAAMDYrv2AAAAAAAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAAABxS4QA2K3rAAAAAIAAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAANiu/YAAAAAaA2VlgAAAAAAAAABA2K8BAAAAAAAAAAAfb6CIo5dX+M9ULQYoCWJ3CCnpN9d/x91oBiX/oOdynMAAAAAAcUtrANit6wAAAACAAAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAwAAAAADYrv2AAAAAGgNlZYAAAAA',
                    memo_type: 'none',
                    signatures: [
                        'lHIFUVI4zaeOWaxlSnbl1pucEZ32DsAvUssdqeSEB1eb2mlHlfy2xKx9DKQ4RD8/JgjgRAsW/Xp5bRzIWBrRDg==',
                    ],
                    preconditions: {
                        timebounds: {
                            min_time: '0',
                            max_time: '1745721100',
                        },
                    },
                },
            },
            expectedOutput: {
                amount: '0',
                blockHeight: 56802308,
                blockTime: 1745720805,
                details: {
                    size: 0,
                    totalInput: '0',
                    totalOutput: '0',
                    vin: [],
                    vout: [],
                },
                fee: '100',
                feeRate: undefined,
                internalTransfers: [],
                stellarSpecific: {
                    memo: undefined,
                },
                targets: [],
                tokens: [],
                txid: '29854b425e62081bbf845c2b10e8bdb525e3a3765d8ca53bc1a0bd0c88a0f265',
                type: 'unknown',
            },
        },
        {
            description: 'transaction contains text memo',
            input: {
                descriptor: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                tx: {
                    memo: 'Hello, Trezor!',
                    memo_bytes: 'SGVsbG8sIFRyZXpvciE=',
                    _links: {
                        self: {
                            href: 'https://horizon.stellar.org/transactions/e8e450b24a344c4d697f998aa1df04e21947cd700d54a219c7c4ed30ab279385',
                        },
                        account: {
                            href: 'https://horizon.stellar.org/accounts/GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                        },
                        ledger: {
                            href: 'https://horizon.stellar.org/ledgers/56802381',
                        },
                        operations: {
                            href: 'https://horizon.stellar.org/transactions/e8e450b24a344c4d697f998aa1df04e21947cd700d54a219c7c4ed30ab279385/operations{?cursor,limit,order}',
                            templated: true,
                        },
                        effects: {
                            href: 'https://horizon.stellar.org/transactions/e8e450b24a344c4d697f998aa1df04e21947cd700d54a219c7c4ed30ab279385/effects{?cursor,limit,order}',
                            templated: true,
                        },
                        precedes: {
                            href: 'https://horizon.stellar.org/transactions?order=asc\u0026cursor=243964368730591232',
                        },
                        succeeds: {
                            href: 'https://horizon.stellar.org/transactions?order=desc\u0026cursor=243964368730591232',
                        },
                        transaction: {
                            href: 'https://horizon.stellar.org/transactions/e8e450b24a344c4d697f998aa1df04e21947cd700d54a219c7c4ed30ab279385',
                        },
                    },
                    id: 'e8e450b24a344c4d697f998aa1df04e21947cd700d54a219c7c4ed30ab279385',
                    paging_token: '243964368730591232',
                    successful: true,
                    hash: 'e8e450b24a344c4d697f998aa1df04e21947cd700d54a219c7c4ed30ab279385',
                    ledger_attr: 56802381,
                    created_at: '2025-04-27T02:33:36Z',
                    source_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    source_account_sequence: '243959279193686027',
                    fee_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    fee_charged: '100',
                    max_fee: '100',
                    operation_count: 1,
                    envelope_xdr:
                        'AAAAAgAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAGQDYresAAAACwAAAAEAAAAAAAAAAAAAAABoDZimAAAAAQAAAA5IZWxsbywgVHJlem9yIQAAAAAAAQAAAAAAAAABAAAAAKVx7asmA/0/QLvOzRB7YP5aSLaYVqZhVTJ+/jQFixEQAAAAAAAAAAAAAYagAAAAAAAAAAGDncpzAAAAQFJwP/ACWw4csxtJZQ+yfx8mb78Vp31wmnxIgioyLZ94e0TfD5MuocDMoNr9sA+XnYlTdRZBcBeqyERuQMd0vwU=',
                    result_xdr: 'AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAA=',
                    fee_meta_xdr:
                        'AAAAAgAAAAMDYrxHAAAAAAAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAAABwJcQA2K3rAAAAAoAAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAANivEcAAAAAaA2XXQAAAAAAAAABA2K8TQAAAAAAAAAAfb6CIo5dX+M9ULQYoCWJ3CCnpN9d/x91oBiX/oOdynMAAAAAAcCWrANit6wAAAAKAAAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAwAAAAADYrxHAAAAAGgNl10AAAAA',
                    memo_type: 'text',
                    signatures: [
                        'UnA/8AJbDhyzG0llD7J/HyZvvxWnfXCafEiCKjItn3h7RN8Pky6hwMyg2v2wD5ediVN1FkFwF6rIRG5Ax3S/BQ==',
                    ],
                    preconditions: {
                        timebounds: {
                            min_time: '0',
                            max_time: '1745721510',
                        },
                    },
                },
            },
            expectedOutput: {
                amount: '100000',
                blockHeight: 56802381,
                blockTime: 1745721216,
                details: {
                    size: 0,
                    totalInput: '100000',
                    totalOutput: '100000',
                    vin: [
                        {
                            addresses: ['GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4'],
                            isAddress: true,
                            n: 0,
                            value: '100000',
                        },
                    ],
                    vout: [
                        {
                            addresses: ['GCSXD3NLEYB72P2AXPHM2ED3MD7FUSFWTBLKMYKVGJ7P4NAFRMIRA74Z'],
                            isAddress: true,
                            n: 0,
                            value: '100000',
                        },
                    ],
                },
                fee: '100',
                feeRate: undefined,
                internalTransfers: [],
                stellarSpecific: {
                    memo: 'Hello, Trezor!',
                },
                targets: [
                    {
                        addresses: ['GCSXD3NLEYB72P2AXPHM2ED3MD7FUSFWTBLKMYKVGJ7P4NAFRMIRA74Z'],
                        amount: '100000',
                        isAddress: true,
                        n: 0,
                    },
                ],
                tokens: [],
                txid: 'e8e450b24a344c4d697f998aa1df04e21947cd700d54a219c7c4ed30ab279385',
                type: 'sent',
            },
        },
        {
            description: 'transaction contains id memo',
            input: {
                descriptor: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                tx: {
                    memo: '9223372036854775807',
                    _links: {
                        self: {
                            href: 'https://horizon.stellar.org/transactions/02e230fa85d9c30e77a37da960e91af53ee18fed4d4f082461af9dbfb35cf837',
                        },
                        account: {
                            href: 'https://horizon.stellar.org/accounts/GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                        },
                        ledger: {
                            href: 'https://horizon.stellar.org/ledgers/56802375',
                        },
                        operations: {
                            href: 'https://horizon.stellar.org/transactions/02e230fa85d9c30e77a37da960e91af53ee18fed4d4f082461af9dbfb35cf837/operations{?cursor,limit,order}',
                            templated: true,
                        },
                        effects: {
                            href: 'https://horizon.stellar.org/transactions/02e230fa85d9c30e77a37da960e91af53ee18fed4d4f082461af9dbfb35cf837/effects{?cursor,limit,order}',
                            templated: true,
                        },
                        precedes: {
                            href: 'https://horizon.stellar.org/transactions?order=asc\u0026cursor=243964342960451584',
                        },
                        succeeds: {
                            href: 'https://horizon.stellar.org/transactions?order=desc\u0026cursor=243964342960451584',
                        },
                        transaction: {
                            href: 'https://horizon.stellar.org/transactions/02e230fa85d9c30e77a37da960e91af53ee18fed4d4f082461af9dbfb35cf837',
                        },
                    },
                    id: '02e230fa85d9c30e77a37da960e91af53ee18fed4d4f082461af9dbfb35cf837',
                    paging_token: '243964342960451584',
                    successful: true,
                    hash: '02e230fa85d9c30e77a37da960e91af53ee18fed4d4f082461af9dbfb35cf837',
                    ledger_attr: 56802375,
                    created_at: '2025-04-27T02:33:01Z',
                    source_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    source_account_sequence: '243959279193686026',
                    fee_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    fee_charged: '100',
                    max_fee: '100',
                    operation_count: 1,
                    envelope_xdr:
                        'AAAAAgAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAGQDYresAAAACgAAAAEAAAAAAAAAAAAAAABoDZiEAAAAAn//////////AAAAAQAAAAAAAAABAAAAAKVx7asmA/0/QLvOzRB7YP5aSLaYVqZhVTJ+/jQFixEQAAAAAAAAAAAAAYagAAAAAAAAAAGDncpzAAAAQM8eIhPxLRiyYMLoMW2Q2C/HxlhDLi2tOPQM5S5hErwCRBPKsVhyqDEq6k7O0hMf7Onixj8VXjsigZ3bhdRPzAs=',
                    result_xdr: 'AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAA=',
                    fee_meta_xdr:
                        'AAAAAgAAAAMDYrxBAAAAAAAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAAABwh4UA2K3rAAAAAkAAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAANivEEAAAAAaA2XOwAAAAAAAAABA2K8RwAAAAAAAAAAfb6CIo5dX+M9ULQYoCWJ3CCnpN9d/x91oBiX/oOdynMAAAAAAcIdsANit6wAAAAJAAAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAwAAAAADYrxBAAAAAGgNlzsAAAAA',
                    memo_type: 'id',
                    signatures: [
                        'zx4iE/EtGLJgwugxbZDYL8fGWEMuLa049AzlLmESvAJEE8qxWHKoMSrqTs7SEx/s6eLGPxVeOyKBnduF1E/MCw==',
                    ],
                    preconditions: {
                        timebounds: {
                            min_time: '0',
                            max_time: '1745721476',
                        },
                    },
                },
            },
            expectedOutput: {
                amount: '100000',
                blockHeight: 56802375,
                blockTime: 1745721181,
                details: {
                    size: 0,
                    totalInput: '100000',
                    totalOutput: '100000',
                    vin: [
                        {
                            addresses: ['GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4'],
                            isAddress: true,
                            n: 0,
                            value: '100000',
                        },
                    ],
                    vout: [
                        {
                            addresses: ['GCSXD3NLEYB72P2AXPHM2ED3MD7FUSFWTBLKMYKVGJ7P4NAFRMIRA74Z'],
                            isAddress: true,
                            n: 0,
                            value: '100000',
                        },
                    ],
                },
                fee: '100',
                feeRate: undefined,
                internalTransfers: [],
                stellarSpecific: {
                    memo: '9223372036854775807',
                },
                targets: [
                    {
                        addresses: ['GCSXD3NLEYB72P2AXPHM2ED3MD7FUSFWTBLKMYKVGJ7P4NAFRMIRA74Z'],
                        amount: '100000',
                        isAddress: true,
                        n: 0,
                    },
                ],
                tokens: [],
                txid: '02e230fa85d9c30e77a37da960e91af53ee18fed4d4f082461af9dbfb35cf837',
                type: 'sent',
            },
        },
        {
            description: 'transaction contains hash memo',
            input: {
                descriptor: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                tx: {
                    memo: 'rBqxQHlSBgmBRKc03H4CU9mvp411cCNm+TuXgs6XOmM=',
                    _links: {
                        self: {
                            href: 'https://horizon.stellar.org/transactions/4797e21ab8ce3730ab1e3ae00d2650f131b883d68f56995ef8f8546f07c71968',
                        },
                        account: {
                            href: 'https://horizon.stellar.org/accounts/GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                        },
                        ledger: {
                            href: 'https://horizon.stellar.org/ledgers/56802369',
                        },
                        operations: {
                            href: 'https://horizon.stellar.org/transactions/4797e21ab8ce3730ab1e3ae00d2650f131b883d68f56995ef8f8546f07c71968/operations{?cursor,limit,order}',
                            templated: true,
                        },
                        effects: {
                            href: 'https://horizon.stellar.org/transactions/4797e21ab8ce3730ab1e3ae00d2650f131b883d68f56995ef8f8546f07c71968/effects{?cursor,limit,order}',
                            templated: true,
                        },
                        precedes: {
                            href: 'https://horizon.stellar.org/transactions?order=asc\u0026cursor=243964317190787072',
                        },
                        succeeds: {
                            href: 'https://horizon.stellar.org/transactions?order=desc\u0026cursor=243964317190787072',
                        },
                        transaction: {
                            href: 'https://horizon.stellar.org/transactions/4797e21ab8ce3730ab1e3ae00d2650f131b883d68f56995ef8f8546f07c71968',
                        },
                    },
                    id: '4797e21ab8ce3730ab1e3ae00d2650f131b883d68f56995ef8f8546f07c71968',
                    paging_token: '243964317190787072',
                    successful: true,
                    hash: '4797e21ab8ce3730ab1e3ae00d2650f131b883d68f56995ef8f8546f07c71968',
                    ledger_attr: 56802369,
                    created_at: '2025-04-27T02:32:27Z',
                    source_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    source_account_sequence: '243959279193686025',
                    fee_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    fee_charged: '100',
                    max_fee: '100',
                    operation_count: 1,
                    envelope_xdr:
                        'AAAAAgAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAGQDYresAAAACQAAAAEAAAAAAAAAAAAAAABoDZhhAAAAA6wasUB5UgYJgUSnNNx+AlPZr6eNdXAjZvk7l4LOlzpjAAAAAQAAAAAAAAABAAAAAKVx7asmA/0/QLvOzRB7YP5aSLaYVqZhVTJ+/jQFixEQAAAAAAAAAAAAAYagAAAAAAAAAAGDncpzAAAAQO2i3fkr1okRRPVPoyncSwheSpvKpclXXBwxl+HFx5P66UCKcjUpCmUFcbsynzVFKB6gSaWcr/jNUU4e02NXZwk=',
                    result_xdr: 'AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAA=',
                    fee_meta_xdr:
                        'AAAAAgAAAAMDYrw8AAAAAAAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAAABw6UYA2K3rAAAAAgAAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAANivDwAAAAAaA2XHgAAAAAAAAABA2K8QQAAAAAAAAAAfb6CIo5dX+M9ULQYoCWJ3CCnpN9d/x91oBiX/oOdynMAAAAAAcOktANit6wAAAAIAAAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAwAAAAADYrw8AAAAAGgNlx4AAAAA',
                    memo_type: 'hash',
                    signatures: [
                        '7aLd+SvWiRFE9U+jKdxLCF5Km8qlyVdcHDGX4cXHk/rpQIpyNSkKZQVxuzKfNUUoHqBJpZyv+M1RTh7TY1dnCQ==',
                    ],
                    preconditions: {
                        timebounds: {
                            min_time: '0',
                            max_time: '1745721441',
                        },
                    },
                },
            },
            expectedOutput: {
                amount: '100000',
                blockHeight: 56802369,
                blockTime: 1745721147,
                details: {
                    size: 0,
                    totalInput: '100000',
                    totalOutput: '100000',
                    vin: [
                        {
                            addresses: ['GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4'],
                            isAddress: true,
                            n: 0,
                            value: '100000',
                        },
                    ],
                    vout: [
                        {
                            addresses: ['GCSXD3NLEYB72P2AXPHM2ED3MD7FUSFWTBLKMYKVGJ7P4NAFRMIRA74Z'],
                            isAddress: true,
                            n: 0,
                            value: '100000',
                        },
                    ],
                },
                fee: '100',
                feeRate: undefined,
                internalTransfers: [],
                stellarSpecific: {
                    memo: 'ac1ab140795206098144a734dc7e0253d9afa78d75702366f93b9782ce973a63',
                },
                targets: [
                    {
                        addresses: ['GCSXD3NLEYB72P2AXPHM2ED3MD7FUSFWTBLKMYKVGJ7P4NAFRMIRA74Z'],
                        amount: '100000',
                        isAddress: true,
                        n: 0,
                    },
                ],
                tokens: [],
                txid: '4797e21ab8ce3730ab1e3ae00d2650f131b883d68f56995ef8f8546f07c71968',
                type: 'sent',
            },
        },
        {
            description: 'transaction contains return hash memo',
            input: {
                descriptor: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                tx: {
                    memo: 'W+A8XOUdhZreUmrp+1ZCBHcl4tytYvMU+tqa+wTsV8w=',
                    _links: {
                        self: {
                            href: 'https://horizon.stellar.org/transactions/6a5561e26fbd7c26f45784b796bbced470f8adca5f8aa64262766f60bc8bf649',
                        },
                        account: {
                            href: 'https://horizon.stellar.org/accounts/GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                        },
                        ledger: {
                            href: 'https://horizon.stellar.org/ledgers/56802364',
                        },
                        operations: {
                            href: 'https://horizon.stellar.org/transactions/6a5561e26fbd7c26f45784b796bbced470f8adca5f8aa64262766f60bc8bf649/operations{?cursor,limit,order}',
                            templated: true,
                        },
                        effects: {
                            href: 'https://horizon.stellar.org/transactions/6a5561e26fbd7c26f45784b796bbced470f8adca5f8aa64262766f60bc8bf649/effects{?cursor,limit,order}',
                            templated: true,
                        },
                        precedes: {
                            href: 'https://horizon.stellar.org/transactions?order=asc\u0026cursor=243964295715688448',
                        },
                        succeeds: {
                            href: 'https://horizon.stellar.org/transactions?order=desc\u0026cursor=243964295715688448',
                        },
                        transaction: {
                            href: 'https://horizon.stellar.org/transactions/6a5561e26fbd7c26f45784b796bbced470f8adca5f8aa64262766f60bc8bf649',
                        },
                    },
                    id: '6a5561e26fbd7c26f45784b796bbced470f8adca5f8aa64262766f60bc8bf649',
                    paging_token: '243964295715688448',
                    successful: true,
                    hash: '6a5561e26fbd7c26f45784b796bbced470f8adca5f8aa64262766f60bc8bf649',
                    ledger_attr: 56802364,
                    created_at: '2025-04-27T02:31:58Z',
                    source_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    source_account_sequence: '243959279193686024',
                    fee_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    fee_charged: '100',
                    max_fee: '100',
                    operation_count: 1,
                    envelope_xdr:
                        'AAAAAgAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAGQDYresAAAACAAAAAEAAAAAAAAAAAAAAABoDZhEAAAABFvgPFzlHYWa3lJq6ftWQgR3JeLcrWLzFPramvsE7FfMAAAAAQAAAAAAAAABAAAAAKVx7asmA/0/QLvOzRB7YP5aSLaYVqZhVTJ+/jQFixEQAAAAAAAAAAAAAYagAAAAAAAAAAGDncpzAAAAQMiBvoTcSFleeBqdDVGPVuLQuT8OSiuF/ijmcP1adBHB/T7BLCMacffUtiDJj21+duILT5HkJZZqNGeXo75K+As=',
                    result_xdr: 'AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAA=',
                    fee_meta_xdr:
                        'AAAAAgAAAAMDYrw3AAAAAAAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAAABxSwcA2K3rAAAAAcAAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAANivDcAAAAAaA2XAgAAAAAAAAABA2K8PAAAAAAAAAAAfb6CIo5dX+M9ULQYoCWJ3CCnpN9d/x91oBiX/oOdynMAAAAAAcUruANit6wAAAAHAAAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAwAAAAADYrw3AAAAAGgNlwIAAAAA',
                    memo_type: 'return',
                    signatures: [
                        'yIG+hNxIWV54Gp0NUY9W4tC5Pw5KK4X+KOZw/Vp0EcH9PsEsIxpx99S2IMmPbX524gtPkeQllmo0Z5ejvkr4Cw==',
                    ],
                    preconditions: {
                        timebounds: {
                            min_time: '0',
                            max_time: '1745721412',
                        },
                    },
                },
            },
            expectedOutput: {
                amount: '100000',
                blockHeight: 56802364,
                blockTime: 1745721118,
                details: {
                    size: 0,
                    totalInput: '100000',
                    totalOutput: '100000',
                    vin: [
                        {
                            addresses: ['GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4'],
                            isAddress: true,
                            n: 0,
                            value: '100000',
                        },
                    ],
                    vout: [
                        {
                            addresses: ['GCSXD3NLEYB72P2AXPHM2ED3MD7FUSFWTBLKMYKVGJ7P4NAFRMIRA74Z'],
                            isAddress: true,
                            n: 0,
                            value: '100000',
                        },
                    ],
                },
                fee: '100',
                feeRate: undefined,
                internalTransfers: [],
                stellarSpecific: {
                    memo: '5be03c5ce51d859ade526ae9fb5642047725e2dcad62f314fada9afb04ec57cc',
                },
                targets: [
                    {
                        addresses: ['GCSXD3NLEYB72P2AXPHM2ED3MD7FUSFWTBLKMYKVGJ7P4NAFRMIRA74Z'],
                        amount: '100000',
                        isAddress: true,
                        n: 0,
                    },
                ],
                tokens: [],
                txid: '6a5561e26fbd7c26f45784b796bbced470f8adca5f8aa64262766f60bc8bf649',
                type: 'sent',
            },
        },
        {
            description: 'transaction without memo',
            input: {
                descriptor: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                tx: {
                    _links: {
                        self: {
                            href: 'https://horizon.stellar.org/transactions/b79fdafa47f46eeb0ff2fcb97805796ef72b8cd8f4df1d9af2f9cd9769af5778',
                        },
                        account: {
                            href: 'https://horizon.stellar.org/accounts/GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                        },
                        ledger: {
                            href: 'https://horizon.stellar.org/ledgers/56802415',
                        },
                        operations: {
                            href: 'https://horizon.stellar.org/transactions/b79fdafa47f46eeb0ff2fcb97805796ef72b8cd8f4df1d9af2f9cd9769af5778/operations{?cursor,limit,order}',
                            templated: true,
                        },
                        effects: {
                            href: 'https://horizon.stellar.org/transactions/b79fdafa47f46eeb0ff2fcb97805796ef72b8cd8f4df1d9af2f9cd9769af5778/effects{?cursor,limit,order}',
                            templated: true,
                        },
                        precedes: {
                            href: 'https://horizon.stellar.org/transactions?order=asc\u0026cursor=243964514759024640',
                        },
                        succeeds: {
                            href: 'https://horizon.stellar.org/transactions?order=desc\u0026cursor=243964514759024640',
                        },
                        transaction: {
                            href: 'https://horizon.stellar.org/transactions/b79fdafa47f46eeb0ff2fcb97805796ef72b8cd8f4df1d9af2f9cd9769af5778',
                        },
                    },
                    id: 'b79fdafa47f46eeb0ff2fcb97805796ef72b8cd8f4df1d9af2f9cd9769af5778',
                    paging_token: '243964514759024640',
                    successful: true,
                    hash: 'b79fdafa47f46eeb0ff2fcb97805796ef72b8cd8f4df1d9af2f9cd9769af5778',
                    ledger_attr: 56802415,
                    created_at: '2025-04-27T02:36:45Z',
                    source_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    source_account_sequence: '243959279193686028',
                    fee_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    fee_charged: '100',
                    max_fee: '100',
                    operation_count: 1,
                    envelope_xdr:
                        'AAAAAgAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAGQDYresAAAADAAAAAEAAAAAAAAAAAAAAABoDZlnAAAAAAAAAAEAAAAAAAAAAQAAAAClce2rJgP9P0C7zs0Qe2D+Wki2mFamYVUyfv40BYsREAAAAAAAAAAAAAGGoAAAAAAAAAABg53KcwAAAEBOsseOVko2KR4LNAPKrEuwclRWumr33YpQkjoE7EkDyEr3EPO00MAK2DQZAj5c5W6PX+eA3jp4YUdKJmZEA+YC',
                    result_xdr: 'AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAA=',
                    fee_meta_xdr:
                        'AAAAAgAAAAMDYrxNAAAAAAAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAAABvxAMA2K3rAAAAAsAAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAANivE0AAAAAaA2XgAAAAAAAAAABA2K8bwAAAAAAAAAAfb6CIo5dX+M9ULQYoCWJ3CCnpN9d/x91oBiX/oOdynMAAAAAAb8PqANit6wAAAALAAAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAwAAAAADYrxNAAAAAGgNl4AAAAAA',
                    memo_type: 'none',
                    signatures: [
                        'TrLHjlZKNikeCzQDyqxLsHJUVrpq992KUJI6BOxJA8hK9xDztNDACtg0GQI+XOVuj1/ngN46eGFHSiZmRAPmAg==',
                    ],
                    preconditions: {
                        timebounds: {
                            min_time: '0',
                            max_time: '1745721703',
                        },
                    },
                },
            },
            expectedOutput: {
                amount: '100000',
                blockHeight: 56802415,
                blockTime: 1745721405,
                details: {
                    size: 0,
                    totalInput: '100000',
                    totalOutput: '100000',
                    vin: [
                        {
                            addresses: ['GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4'],
                            isAddress: true,
                            n: 0,
                            value: '100000',
                        },
                    ],
                    vout: [
                        {
                            addresses: ['GCSXD3NLEYB72P2AXPHM2ED3MD7FUSFWTBLKMYKVGJ7P4NAFRMIRA74Z'],
                            isAddress: true,
                            n: 0,
                            value: '100000',
                        },
                    ],
                },
                fee: '100',
                feeRate: undefined,
                internalTransfers: [],
                stellarSpecific: {
                    memo: undefined,
                },
                targets: [
                    {
                        addresses: ['GCSXD3NLEYB72P2AXPHM2ED3MD7FUSFWTBLKMYKVGJ7P4NAFRMIRA74Z'],
                        amount: '100000',
                        isAddress: true,
                        n: 0,
                    },
                ],
                tokens: [],
                txid: 'b79fdafa47f46eeb0ff2fcb97805796ef72b8cd8f4df1d9af2f9cd9769af5778',
                type: 'sent',
            },
        },
        {
            description: 'failed transaction',
            input: {
                descriptor: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                tx: {
                    _links: {
                        self: {
                            href: 'https://horizon.stellar.org/transactions/f07f3386b67992a57075bfad6d6c5e2d922d0d0e395313ba70b2dea773265c19',
                        },
                        account: {
                            href: 'https://horizon.stellar.org/accounts/GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                        },
                        ledger: {
                            href: 'https://horizon.stellar.org/ledgers/56802521',
                        },
                        operations: {
                            href: 'https://horizon.stellar.org/transactions/f07f3386b67992a57075bfad6d6c5e2d922d0d0e395313ba70b2dea773265c19/operations{?cursor,limit,order}',
                            templated: true,
                        },
                        effects: {
                            href: 'https://horizon.stellar.org/transactions/f07f3386b67992a57075bfad6d6c5e2d922d0d0e395313ba70b2dea773265c19/effects{?cursor,limit,order}',
                            templated: true,
                        },
                        precedes: {
                            href: 'https://horizon.stellar.org/transactions?order=asc\u0026cursor=243964970025824256',
                        },
                        succeeds: {
                            href: 'https://horizon.stellar.org/transactions?order=desc\u0026cursor=243964970025824256',
                        },
                        transaction: {
                            href: 'https://horizon.stellar.org/transactions/f07f3386b67992a57075bfad6d6c5e2d922d0d0e395313ba70b2dea773265c19',
                        },
                    },
                    id: 'f07f3386b67992a57075bfad6d6c5e2d922d0d0e395313ba70b2dea773265c19',
                    paging_token: '243964970025824256',
                    successful: false,
                    hash: 'f07f3386b67992a57075bfad6d6c5e2d922d0d0e395313ba70b2dea773265c19',
                    ledger_attr: 56802521,
                    created_at: '2025-04-27T02:46:41Z',
                    source_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    source_account_sequence: '243959279193686029',
                    fee_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    fee_charged: '100',
                    max_fee: '100',
                    operation_count: 1,
                    envelope_xdr:
                        'AAAAAgAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAGQDYresAAAADQAAAAEAAAAAAAAAAAAAAABoDZu5AAAAAAAAAAEAAAAAAAAAAQAAAAClce2rJgP9P0C7zs0Qe2D+Wki2mFamYVUyfv40BYsREAAAAAAAAAAAO5rKAAAAAAAAAAABg53KcwAAAED2xFPtGtnmfwfll5OD1Tdeqh+B9K2kaqy+wwOu83i8in/P2miIs0AKpdRmW4Apc9laopVMTstdMW1zUZCBX+gF',
                    result_xdr: 'AAAAAAAAAGT/////AAAAAQAAAAAAAAAB/////gAAAAA=',
                    fee_meta_xdr:
                        'AAAAAgAAAAMDYrxvAAAAAAAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAAABvYkIA2K3rAAAAAwAAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAANivG8AAAAAaA2YPQAAAAAAAAABA2K82QAAAAAAAAAAfb6CIo5dX+M9ULQYoCWJ3CCnpN9d/x91oBiX/oOdynMAAAAAAb2IpANit6wAAAAMAAAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAwAAAAADYrxvAAAAAGgNmD0AAAAA',
                    memo_type: 'none',
                    signatures: [
                        '9sRT7RrZ5n8H5ZeTg9U3XqofgfStpGqsvsMDrvN4vIp/z9poiLNACqXUZluAKXPZWqKVTE7LXTFtc1GQgV/oBQ==',
                    ],
                    preconditions: {
                        timebounds: {
                            min_time: '0',
                            max_time: '1745722297',
                        },
                    },
                },
            },
            expectedOutput: {
                amount: '0',
                blockHeight: 56802521,
                blockTime: 1745722001,
                details: {
                    size: 0,
                    totalInput: '0',
                    totalOutput: '0',
                    vin: [],
                    vout: [],
                },
                fee: '100',
                feeRate: undefined,
                internalTransfers: [],
                stellarSpecific: {
                    memo: undefined,
                },
                targets: [],
                tokens: [],
                txid: 'f07f3386b67992a57075bfad6d6c5e2d922d0d0e395313ba70b2dea773265c19',
                type: 'failed',
            },
        },
        {
            description: 'transaction contains a set options operation',
            input: {
                descriptor: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                tx: {
                    _links: {
                        self: {
                            href: 'https://horizon.stellar.org/transactions/4138ccff08862970e18493723a5040879e713fa87c724907dceb107a1f1b8be7',
                        },
                        account: {
                            href: 'https://horizon.stellar.org/accounts/GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                        },
                        ledger: {
                            href: 'https://horizon.stellar.org/ledgers/56805071',
                        },
                        operations: {
                            href: 'https://horizon.stellar.org/transactions/4138ccff08862970e18493723a5040879e713fa87c724907dceb107a1f1b8be7/operations{?cursor,limit,order}',
                            templated: true,
                        },
                        effects: {
                            href: 'https://horizon.stellar.org/transactions/4138ccff08862970e18493723a5040879e713fa87c724907dceb107a1f1b8be7/effects{?cursor,limit,order}',
                            templated: true,
                        },
                        precedes: {
                            href: 'https://horizon.stellar.org/transactions?order=asc\u0026cursor=243975922192400384',
                        },
                        succeeds: {
                            href: 'https://horizon.stellar.org/transactions?order=desc\u0026cursor=243975922192400384',
                        },
                        transaction: {
                            href: 'https://horizon.stellar.org/transactions/4138ccff08862970e18493723a5040879e713fa87c724907dceb107a1f1b8be7',
                        },
                    },
                    id: '4138ccff08862970e18493723a5040879e713fa87c724907dceb107a1f1b8be7',
                    paging_token: '243975922192400384',
                    successful: true,
                    hash: '4138ccff08862970e18493723a5040879e713fa87c724907dceb107a1f1b8be7',
                    ledger_attr: 56805071,
                    created_at: '2025-04-27T06:47:01Z',
                    source_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    source_account_sequence: '243959279193686033',
                    fee_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    fee_charged: '100',
                    max_fee: '100',
                    operation_count: 1,
                    envelope_xdr:
                        'AAAAAgAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAGQDYresAAAAEQAAAAEAAAAAAAAAAAAAAABoDdQLAAAAAAAAAAEAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAEAAAD/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYOdynMAAABArypJWghTnQjk4g531/zGndti9jlhAiAPRm2IV7a78mQphSCOuVjYx/4wBlGC1Cl5Rds7dYnBP4p4IDIYe1LODQ==',
                    result_xdr: 'AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAAFAAAAAAAAAAA=',
                    fee_meta_xdr:
                        'AAAAAgAAAAMDYsbIAAAAAAAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAAABEFeIA2K3rAAAABAAAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAANixsgAAAAAaA3SvgAAAAAAAAABA2LGzwAAAAAAAAAAfb6CIo5dX+M9ULQYoCWJ3CCnpN9d/x91oBiX/oOdynMAAAAAARBXJANit6wAAAAQAAAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAwAAAAADYsbIAAAAAGgN0r4AAAAA',
                    memo_type: 'none',
                    signatures: [
                        'rypJWghTnQjk4g531/zGndti9jlhAiAPRm2IV7a78mQphSCOuVjYx/4wBlGC1Cl5Rds7dYnBP4p4IDIYe1LODQ==',
                    ],
                    preconditions: {
                        timebounds: {
                            min_time: '0',
                            max_time: '1745736715',
                        },
                    },
                },
            },
            expectedOutput: {
                amount: '0',
                blockHeight: 56805071,
                blockTime: 1745736421,
                details: {
                    size: 0,
                    totalInput: '0',
                    totalOutput: '0',
                    vin: [],
                    vout: [],
                },
                fee: '100',
                feeRate: undefined,
                internalTransfers: [],
                stellarSpecific: {
                    memo: undefined,
                },
                targets: [],
                tokens: [],
                txid: '4138ccff08862970e18493723a5040879e713fa87c724907dceb107a1f1b8be7',
                type: 'unknown',
            },
        },
        {
            description:
                'transaction contains a payment operation, but descriptor is not the sender or receiver',
            input: {
                descriptor: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                tx: {
                    _links: {
                        self: {
                            href: 'https://horizon.stellar.org/transactions/a15e5979d25e1eaa9682a4524dcdad557fd7733879e3ac9899958af79e9991ff',
                        },
                        account: {
                            href: 'https://horizon.stellar.org/accounts/GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                        },
                        ledger: {
                            href: 'https://horizon.stellar.org/ledgers/56805805',
                        },
                        operations: {
                            href: 'https://horizon.stellar.org/transactions/a15e5979d25e1eaa9682a4524dcdad557fd7733879e3ac9899958af79e9991ff/operations{?cursor,limit,order}',
                            templated: true,
                        },
                        effects: {
                            href: 'https://horizon.stellar.org/transactions/a15e5979d25e1eaa9682a4524dcdad557fd7733879e3ac9899958af79e9991ff/effects{?cursor,limit,order}',
                            templated: true,
                        },
                        precedes: {
                            href: 'https://horizon.stellar.org/transactions?order=asc\u0026cursor=243979074698002432',
                        },
                        succeeds: {
                            href: 'https://horizon.stellar.org/transactions?order=desc\u0026cursor=243979074698002432',
                        },
                        transaction: {
                            href: 'https://horizon.stellar.org/transactions/a15e5979d25e1eaa9682a4524dcdad557fd7733879e3ac9899958af79e9991ff',
                        },
                    },
                    id: 'a15e5979d25e1eaa9682a4524dcdad557fd7733879e3ac9899958af79e9991ff',
                    paging_token: '243979074698002432',
                    successful: true,
                    hash: 'a15e5979d25e1eaa9682a4524dcdad557fd7733879e3ac9899958af79e9991ff',
                    ledger_attr: 56805805,
                    created_at: '2025-04-27T07:55:28Z',
                    source_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    source_account_sequence: '243959279193686034',
                    fee_account: 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4',
                    fee_charged: '100',
                    max_fee: '100',
                    operation_count: 1,
                    envelope_xdr:
                        'AAAAAgAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAGQDYresAAAAEgAAAAEAAAAAAAAAAAAAAABoDeQYAAAAAAAAAAEAAAABAAAAAKVx7asmA/0/QLvOzRB7YP5aSLaYVqZhVTJ+/jQFixEQAAAAAQAAAABRYKF6YlkNcP7LCFoaqvrzoUTL8w/dA4Wqq4XnX10LLwAAAAAAAAAAABLWhwAAAAAAAAACg53KcwAAAEBqUKQQ+K3iGXzMR9Gt14V/aDirQ7a3UXetMQEu5sAqezCGvgq8wQmnG4QQSynxjpA9digf7QtHu5T+GMdVfOABBYsREAAAAEAYKtJR4zSmL3v9unF79dUe6SuIFyMwX8EwDQ4GCHzve+L5z0ejKduM+iBvQwjHeO7NoB5+j8Am5dg1bRYfLtEC',
                    result_xdr: 'AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAA=',
                    fee_meta_xdr:
                        'AAAAAgAAAAMDYsbPAAAAAAAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAAAABEFckA2K3rAAAABEAAAABAAAAAAAAAAAAAAAA/wAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAANixs8AAAAAaA3S5QAAAAAAAAABA2LJrQAAAAAAAAAAfb6CIo5dX+M9ULQYoCWJ3CCnpN9d/x91oBiX/oOdynMAAAAAARBWwANit6wAAAARAAAAAQAAAAAAAAAAAAAAAP8AAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAwAAAAADYsbPAAAAAGgN0uUAAAAA',
                    memo_type: 'none',
                    signatures: [
                        'alCkEPit4hl8zEfRrdeFf2g4q0O2t1F3rTEBLubAKnswhr4KvMEJpxuEEEsp8Y6QPXYoH+0LR7uU/hjHVXzgAQ==',
                        'GCrSUeM0pi97/bpxe/XVHukriBcjMF/BMA0OBgh873vi+c9HoynbjPogb0MIx3juzaAefo/AJuXYNW0WHy7RAg==',
                    ],
                    preconditions: {
                        timebounds: {
                            min_time: '0',
                            max_time: '1745740824',
                        },
                    },
                },
            },
            expectedOutput: {
                amount: '0',
                blockHeight: 56805805,
                blockTime: 1745740528,
                details: {
                    size: 0,
                    totalInput: '0',
                    totalOutput: '0',
                    vin: [],
                    vout: [],
                },
                fee: '100',
                feeRate: undefined,
                internalTransfers: [],
                stellarSpecific: {
                    memo: undefined,
                },
                targets: [],
                tokens: [],
                txid: 'a15e5979d25e1eaa9682a4524dcdad557fd7733879e3ac9899958af79e9991ff',
                type: 'unknown',
            },
        },
    ],
    buildSendTransactoin: [
        {
            description: 'transaction contains a payment operation',
            input: {
                descriptor: 'GCNLIUDTVTL25HC64AH3MTTZ7RUGOOGB5H3A2P7BWRBW2SPAZ6F3LIM2',
                sequence: '123456789',
                fee: '1200',
                destinationActivated: true,
                destination: 'GCOXEZ4WQ6AAIWW7P2H574TZBQEEGYOZNZ4SL3BG52JZHO6HEXY2D7XG',
                amount: '100.125',
                destinationTag: 'Hello, World!',
                isTestnet: false,
            },
            expectedOutput: new TransactionBuilder(
                new Account(
                    'GCNLIUDTVTL25HC64AH3MTTZ7RUGOOGB5H3A2P7BWRBW2SPAZ6F3LIM2',
                    '123456789',
                ),
                {
                    fee: '1200',
                    networkPassphrase: Networks.PUBLIC,
                },
            )
                .addMemo(Memo.text('Hello, World!'))
                .setTimebounds(0, 0)
                .addOperation(
                    Operation.payment({
                        destination: 'GCOXEZ4WQ6AAIWW7P2H574TZBQEEGYOZNZ4SL3BG52JZHO6HEXY2D7XG',
                        amount: '100.125',
                        asset: Asset.native(),
                    }),
                )
                .build(),
        },
        {
            description: 'transaction contains a create account operation',
            input: {
                descriptor: 'GCNLIUDTVTL25HC64AH3MTTZ7RUGOOGB5H3A2P7BWRBW2SPAZ6F3LIM2',
                sequence: '123456789',
                fee: '1200',
                destinationActivated: false,
                destination: 'GCOXEZ4WQ6AAIWW7P2H574TZBQEEGYOZNZ4SL3BG52JZHO6HEXY2D7XG',
                amount: '100.125',
                destinationTag: 'Hello, World!',
                isTestnet: false,
            },
            expectedOutput: new TransactionBuilder(
                new Account(
                    'GCNLIUDTVTL25HC64AH3MTTZ7RUGOOGB5H3A2P7BWRBW2SPAZ6F3LIM2',
                    '123456789',
                ),
                {
                    fee: '1200',
                    networkPassphrase: Networks.PUBLIC,
                },
            )
                .addMemo(Memo.text('Hello, World!'))
                .setTimebounds(0, 0)
                .addOperation(
                    Operation.createAccount({
                        destination: 'GCOXEZ4WQ6AAIWW7P2H574TZBQEEGYOZNZ4SL3BG52JZHO6HEXY2D7XG',
                        startingBalance: '100.125',
                    }),
                )
                .build(),
        },
        {
            description:
                'transaction contains a payment operation, but destinationTag is undefined',
            input: {
                descriptor: 'GCNLIUDTVTL25HC64AH3MTTZ7RUGOOGB5H3A2P7BWRBW2SPAZ6F3LIM2',
                sequence: '123456789',
                fee: '1200',
                destinationActivated: true,
                destination: 'GCOXEZ4WQ6AAIWW7P2H574TZBQEEGYOZNZ4SL3BG52JZHO6HEXY2D7XG',
                amount: '100.125',
                destinationTag: undefined,
                isTestnet: false,
            },
            expectedOutput: new TransactionBuilder(
                new Account(
                    'GCNLIUDTVTL25HC64AH3MTTZ7RUGOOGB5H3A2P7BWRBW2SPAZ6F3LIM2',
                    '123456789',
                ),
                {
                    fee: '1200',
                    networkPassphrase: Networks.PUBLIC,
                },
            )
                .setTimebounds(0, 0)
                .addOperation(
                    Operation.payment({
                        destination: 'GCOXEZ4WQ6AAIWW7P2H574TZBQEEGYOZNZ4SL3BG52JZHO6HEXY2D7XG',
                        amount: '100.125',
                        asset: Asset.native(),
                    }),
                )
                .build(),
        },
        {
            description: 'transaction contains a payment operation, but on testnet',
            input: {
                descriptor: 'GCNLIUDTVTL25HC64AH3MTTZ7RUGOOGB5H3A2P7BWRBW2SPAZ6F3LIM2',
                sequence: '123456789',
                fee: '1200',
                destinationActivated: true,
                destination: 'GCOXEZ4WQ6AAIWW7P2H574TZBQEEGYOZNZ4SL3BG52JZHO6HEXY2D7XG',
                amount: '100.125',
                destinationTag: 'Hello, World!',
                isTestnet: true,
            },
            expectedOutput: new TransactionBuilder(
                new Account(
                    'GCNLIUDTVTL25HC64AH3MTTZ7RUGOOGB5H3A2P7BWRBW2SPAZ6F3LIM2',
                    '123456789',
                ),
                {
                    fee: '1200',
                    networkPassphrase: Networks.TESTNET,
                },
            )
                .addMemo(Memo.text('Hello, World!'))
                .setTimebounds(0, 0)
                .addOperation(
                    Operation.payment({
                        destination: 'GCOXEZ4WQ6AAIWW7P2H574TZBQEEGYOZNZ4SL3BG52JZHO6HEXY2D7XG',
                        amount: '100.125',
                        asset: Asset.native(),
                    }),
                )
                .build(),
        },
    ],
};
