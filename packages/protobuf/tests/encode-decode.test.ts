import * as ProtoBuf from 'protobufjs/light';

import { encode } from '../src/encode';
import { decode } from '../src/decode';

// message SimpleSignTx {
// 	repeated TxInputType inputs = 1;			// transaction inputs
// 	repeated TxOutputType outputs = 2;			// transaction outputs
// 	repeated TransactionType transactions = 3;		// transactions whose outputs are used to build current inputs
// 	optional string coin_name = 4 [default='Bitcoin'];	// coin to use
// }

// message TxInputType {
// 	repeated uint32 address_n = 1;						// BIP-32 path to derive the key from master node
// 	required bytes prev_hash = 2;						// hash of previous transaction output to spend by this input
// 	required uint32 prev_index = 3;						// index of previous output to spend
// 	optional bytes script_sig = 4;						// script signature, unset for tx to sign
// 	optional uint32 sequence = 5 [default=0xffffffff];			// sequence
// 	optional InputScriptType script_type = 6 [default=SPENDADDRESS];	// defines template of input script
// 	optional MultisigRedeemScriptType multisig = 7;				// Filled if input is going to spend multisig tx
// }

// /**
//  * Structure representing transaction output
//  * @used_in SimpleSignTx
//  * @used_in TransactionType
//  */
// message TxOutputType {
// 	optional string address = 1;			// target coin address in Base58 encoding
// 	repeated uint32 address_n = 2;			// BIP-32 path to derive the key from master node; has higher priority than "address"
// 	required uint64 amount = 3;			// amount to spend in satoshis
// 	required OutputScriptType script_type = 4;	// output script type
// 	optional MultisigRedeemScriptType multisig = 5; // defines multisig address; script_type must be PAYTOMULTISIG
// 	optional bytes op_return_data = 6;		// defines op_return data; script_type must be PAYTOOPRETURN, amount must be 0
// }

/**
 * Structure representing transaction
 * @used_in SimpleSignTx
 */
// message TransactionType {
// 	optional uint32 version = 1;
// 	repeated TxInputType inputs = 2;
// 	repeated TxOutputBinType bin_outputs = 3;
// 	repeated TxOutputType outputs = 5;
// 	optional uint32 lock_time = 4;
// 	optional uint32 inputs_cnt = 6;
// 	optional uint32 outputs_cnt = 7;
// }

/**
 * Type of script which will be used for transaction output
 * @used_in TxOutputType
//  */
// enum OutputScriptType {
// 	PAYTOADDRESS = 0;
// 	PAYTOSCRIPTHASH = 1;
// 	PAYTOMULTISIG = 2;
// 	PAYTOOPRETURN = 3;
// }

// /**
//  * Type of script which will be used for transaction output
//  * @used_in TxInputType
//  */
// enum InputScriptType {
// 	SPENDADDRESS = 0;
// 	SPENDMULTISIG = 1;
// }

// inputs: [
//     {
//         address_n: "m/44'/0'/5'/0/9",
//         prev_hash:
//             '0dac366fd8a67b2a89fbb0d31086e7acded7a5bbf9ef9daa935bc873229ef5b5',
//         prev_index: 0,
//         amount: 63988,
//     },
// ],
// outputs: [
//     {
//         address: '13Hbso8zgV5Wmqn3uA7h3QVtmPzs47wcJ7',
//         amount: 50248,
//         script_type: 'PAYTOADDRESS',
//     },
// ],

const fixtures = [
    {
        name: 'SimpleSignTx',
        message: {
            SimpleSignTx: {
                fields: {
                    inputs: {
                        rule: 'repeated',
                        type: 'TxInputType',
                        id: 0,
                    },
                    outputs: {
                        rule: 'repeated',
                        type: 'TxOutputType',
                        id: 1,
                    },
                    transactions: {
                        rule: 'repeated',
                        type: 'TransactionType',
                        id: 2,
                    },
                },
            },
            TxInputType: {
                fields: {
                    address_n: {
                        rule: 'repeated',
                        type: 'uint32',
                        id: 1,
                        options: {
                            packed: false,
                        },
                    },
                    prev_hash: {
                        type: 'bytes',
                        id: 2,
                    },
                    prev_index: {
                        type: 'uint32',
                        id: 3,
                    },
                    script_sig: {
                        type: 'bytes',
                        id: 4,
                    },
                    sequence: {
                        type: 'uint32',
                        id: 5,
                    },
                    script_type: {
                        type: 'InputScriptType',
                        id: 6,
                    },
                    // multisig: {
                    //     type: 'MultisigRedeemScriptType',
                    //     id: 7,
                    // },
                },
            },
            TxOutputType: {
                fields: {
                    address: {
                        type: 'string',
                        id: 1,
                    },
                    address_n: {
                        rule: 'repeated',
                        type: 'uint32',
                        id: 2,
                        options: {
                            packed: false,
                        },
                    },
                    amount: {
                        type: 'uint64',
                        id: 3,
                    },
                    script_type: {
                        type: 'OutputScriptType',
                        id: 4,
                    },
                    // multisig: {
                    //     type: 'MultisigRedeemScriptType',
                    //     id: 5,
                    // },
                    op_return_data: {
                        type: 'bytes',
                        id: 6,
                    },
                },
            },
            TransactionType: {
                fields: {
                    version: {
                        type: 'uint32',
                        id: 1,
                    },
                    inputs: {
                        rule: 'repeated',
                        type: 'TxInputType',
                        id: 2,
                    },
                    bin_outputs: {
                        rule: 'repeated',
                        type: 'TxOutputBinType',
                        id: 3,
                    },
                    outputs: {
                        rule: 'repeated',
                        type: 'TxOutputType',
                        id: 5,
                    },
                    lock_time: {
                        type: 'uint32',
                        id: 4,
                    },
                    inputs_cnt: {
                        type: 'uint32',
                        id: 6,
                    },
                    outputs_cnt: {
                        type: 'uint32',
                        id: 7,
                    },
                },
            },
            InputScriptType: {
                values: {
                    SPENDADDRESS: 0,
                    SPENDMULTISIG: 1,
                },
            },
            OutputScriptType: {
                values: {
                    PAYTOADDRESS: 0,
                    PAYTOSCRIPTHASH: 1,
                    PAYTOMULTISIG: 2,
                    PAYTOOPRETURN: 3,
                },
            },
        },
        in: {
            inputs: [
                {
                    address_n: [2147483692, 2147483648, 2147483653, 0, 0],
                    prev_hash: '1390b9c88c8522aa1597714c1022e312b2de0ea823fe295e3a0bfefc8553574e',
                    prev_index: 0,
                    amount: 800,
                },
            ],
            outputs: [
                {
                    address: '1PQDx3NnRLtJgasCg6bQvZxQ7NsMCW4KWy',
                    amount: 800,
                    script_type: 'PAYTOADDRESS',
                },
            ],
        },
        encoded:
            '023a08ac808080080880808080080885808080080800080012201390b9c88c8522aa1597714c1022e312b2de0ea823fe295e3a0bfefc8553574e18000a290a223150514478334e6e524c744a6761734367366251765a7851374e734d4357344b577918a0062000',
        out: {
            // txid: "e4753558cfefb0a3e592ef328ae0ed2b213e2201c4177951aa2258c88c9b0931"
            // vout: 0
            // amount: "800"
            // blockHeight: 865675
            // address: "1PQDx3NnRLtJgasCg6bQvZxQ7NsMCW4KWy"
            // path: "m/44'/0'/0'/0/0"
            // confirmations: 395
            // coinbase: undefined
            inputs: [
                {
                    address_n: [2147483692, 2147483648, 2147483653, 0, 0],
                    prev_hash: '1390b9c88c8522aa1597714c1022e312b2de0ea823fe295e3a0bfefc8553574e',
                    prev_index: 0,
                    script_sig: null,
                    script_type: undefined,
                    sequence: null,
                },
            ],
            outputs: [
                {
                    address: '1PQDx3NnRLtJgasCg6bQvZxQ7NsMCW4KWy',
                    address_n: [],
                    amount: 800,
                    op_return_data: null,
                    script_type: 'PAYTOADDRESS',
                },
            ],
            transactions: [],
        },
    },
];

describe('Real messages', () => {
    fixtures.forEach(f => {
        describe(f.name, () => {
            const Messages = ProtoBuf.Root.fromJSON({
                nested: { messages: { nested: { ...f.message } } },
            });
            const Message = Messages.lookupType(`messages.${f.name}`);

            test('encode and decode', () => {
                // serialize
                const encoded = encode(Message, f.in);
                expect(encoded.toString('hex')).toEqual(f.encoded);
                // deserialize
                const decoded = decode(Message, encoded);
                expect(decoded).toEqual(f.out ? f.out : f.in);
            });
        });
    });
});
