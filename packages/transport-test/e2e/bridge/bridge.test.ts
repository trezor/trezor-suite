import * as messages from '@trezor/protobuf/messages.json';
import { BridgeTransport, Descriptor } from '@trezor/transport';
import { Session } from '@trezor/transport/src/types';

import { controller as TrezorUserEnvLink, env } from './controller';
import { pathLength, descriptor as expectedDescriptor } from './expect';
import { assertSuccess } from '../api/utils';

const emulatorStartOpts = { model: 'T2T1', version: '2-main', wipe: true } as const;

describe('bridge', () => {
    let bridge: BridgeTransport;
    let descriptors: Descriptor[];
    let session: Session;

    beforeAll(async () => {
        await TrezorUserEnvLink.connect();
        await TrezorUserEnvLink.startEmu(emulatorStartOpts);
        await TrezorUserEnvLink.startBridge();

        bridge = new BridgeTransport({
            messages: {
                nested: {
                    MessageType: {
                        values: {
                            SimpleSignTx: 0,
                        },
                    },
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
            },
        });
        await bridge.init();

        const enumerateResult = await bridge.enumerate();
        assertSuccess(enumerateResult);
        // expect(enumerateResult).toMatchObject({
        //     success: true,
        //     payload: [
        //         {
        //             path: expect.any(String),
        //             session: null,
        //             product: expectedDescriptor.product,
        //         },
        //     ],
        // });

        const { path } = enumerateResult.payload[0];
        // expect(path.length).toEqual(pathLength);

        descriptors = enumerateResult.payload;

        const acquireResult = await bridge.acquire({
            input: { path: descriptors[0].path, previous: session },
        });
        assertSuccess(acquireResult);
        // expect(acquireResult).toEqual({
        //     success: true,
        //     payload: '1',
        // });
        session = acquireResult.payload;
    });

    afterAll(async () => {
        await TrezorUserEnvLink.stopEmu();
        await TrezorUserEnvLink.stopBridge();
        TrezorUserEnvLink.disconnect();
    });

    test.only(`call(GetFeatures)`, async () => {
        const message = await bridge.call({
            session,
            name: 'SimpleSignTx',
            data: {
                inputs: [
                    {
                        address_n: [2147483692, 2147483648, 2147483653, 0, 0],
                        prev_hash:
                            '1390b9c88c8522aa1597714c1022e312b2de0ea823fe295e3a0bfefc8553574e',
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
        });
        console.log('==== message ====', message);
    });
});
