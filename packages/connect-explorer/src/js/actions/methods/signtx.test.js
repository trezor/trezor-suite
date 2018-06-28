// this example requires a device loaded with seed:
// alcohol woman abuse must during monitor noble actual mixed trade anger aisle

// Python tests:
// https://github.com/trezor/python-trezor/blob/master/tests/device_tests/test_msg_signtx.py


export const SEGWIT_INPUTS = {
    PAY2ADDRESS: [
        {
            address_n: [49 | 0x80000000, 1 | 0x80000000, 0 | 0x80000000, 1, 0],
            amount: 123456789,
            prev_index: 0,
            prev_hash: "20912f98ea3ed849042efed0fdac8cb4fc301961c5988cba56902d8ffb61c337",
            script_type: "SPENDP2SHWITNESS"
        }
    ],
    OPRETURN: [
        {
            address_n: [49 | 0x80000000, 1 | 0x80000000, 0 | 0x80000000, 0, 1], // 0,3
            prev_index: 0,
            prev_hash: "a1372e6d56cf3d2a0665c3022d7ba7ef04cd269eed880d3815dc3ebcd7f11a30",
            amount: 1000,
            script_type: 'SPENDP2SHWITNESS'
        },
    ]
}

export const SEGWIT_OUTPUTS = {
    PAY2ADDRESS: [
        {
            address: "mhRx1CeVfaayqRwq5zgRQmD7W5aWBfD5mC",
            amount: 12300000,
            script_type: "PAYTOADDRESS"
        },
        {
            address_n: [49 | 0x80000000, 1 | 0x80000000, 0 | 0x80000000, 1, 0],
            script_type: "PAYTOP2SHWITNESS",
            amount: 123456789 - 11000 - 12300000,
        }
    ],
    OPRETURN: [
        {
            address_n: [49 | 0x80000000, 1 | 0x80000000, 0 | 0x80000000, 1, 0],
            amount: 1000,
            script_type: 'PAYTOP2SHWITNESS'
        },
        {
            amount: 0, // amount has to be 0 in OP_RETURN, but it has to be present
            script_type: 'PAYTOOPRETURN',
            op_return_data: 'deadbeef' // in hexadecimal
        }
    ]
}

export const LEGACY_INPUTS = {
    PAY2ADDRESS: [ 
        {
            //address_n: [44 | 0x80000000, 0 | 0x80000000, 0 | 0x80000000, 0, 0],
            address_n: [0],
            prev_index: 0,
            prev_hash: "d5f65ee80147b4bcc70b75e4bbf2d7382021b871bd8867ef8fa525ef50864882"
        }
    ],
    OPRETURN: [
        {
            address_n: [44 | 0x80000000, 1 | 0x80000000, 0 | 0x80000000, 0, 1],
            prev_index: 0,
            prev_hash: "78dbd0d19ccf8776ac590225cde5797e439959d05b91ecdbacd7c244afb28542"
        }
    ]
}

export const LEGACY_OUTPUTS = {
    PAY2ADDRESS: [ 
        {
            address: '1MJ2tj2ThBE62zXbBYA5ZaN3fdve5CPAz1',
            amount: 390000 - 10000,
            script_type: 'PAYTOADDRESS'
        },
        {
            //address_n: [44 | 0x80000000, 0 | 0x80000000, 0 | 0x80000000, 1, 0],
            address_n: [1],
            amount: 80000,
            script_type: 'PAYTOADDRESS'
        }
    ],
    OPRETURN: [
        {
            address_n: [44 | 0x80000000, 1 | 0x80000000, 0 | 0x80000000, 1, 0],
            amount: 36500,
            script_type: 'PAYTOADDRESS'
        }, 
        {
            amount: 0, // amount has to be 0 in OP_RETURN, but it has to be present
            script_type: 'PAYTOOPRETURN',
            op_return_data: 'deadbeef' // in hexadecimal
        }
    ]
}