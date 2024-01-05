import { NETWORK_IDS, PROTOCOL_MAGICS } from '../../src/constants/cardano';

import {
    CardanoAddressType,
    CardanoCVoteRegistrationFormat,
    CardanoCertificateType,
    CardanoTxOutputSerializationFormat,
    CardanoTxSigningMode,
} from '@trezor/protobuf/lib/messages-schema';

// vectors from https://github.com/trezor/trezor-firmware/tree/main/python/trezorlib/tests/device_tests/test_msg_cardano_sign_transaction.py

const SAMPLE_INPUTS = {
    byron_input: {
        path: "m/44'/1815'/0'/0/1",
        prev_hash: '1af8fa0b754ff99253d983894e63a2b09cbb56c833ba18c3384210163f63dcfc',
        prev_index: 0,
    },
    shelley_input: {
        path: "m/1852'/1815'/0'/0/0",
        prev_hash: '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
        prev_index: 0,
    },
    shelley_input_2: {
        path: "m/1852'/1815'/0'/0/1",
        prev_hash: '991af8fa0b754ff99253d983894e63a2b09cbb56c833ba18c3384210163f63dc',
        prev_index: 0,
    },
    external_input: {
        path: undefined,
        prev_hash: '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
        prev_index: 0,
    },
    plutus_input: {
        path: "m/1852'/1815'/0'/0/0",
        prev_hash: '1af8fa0b754ff99253d983894e63a2b09cbb56c833ba18c3384210163f63dcfc',
        prev_index: 0,
    },
};

const SAMPLE_OUTPUTS = {
    simple_byron_output: {
        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
        address: 'Ae2tdPwUPEZCanmBz5g2GEwFqKTKpNJcGYPKfDxoNeKZ8bRHr8366kseiK2',
        amount: '3003112',
    },
    byron_change_output: {
        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
        addressParameters: {
            addressType: CardanoAddressType.BYRON,
            path: "m/44'/1815'/0'/0/1",
        },
        amount: '1000000',
    },
    simple_shelley_output: {
        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
        address:
            'addr1q84sh2j72ux0l03fxndjnhctdg7hcppsaejafsa84vh7lwgmcs5wgus8qt4atk45lvt4xfxpjtwfhdmvchdf2m3u3hlsd5tq5r',
        amount: '1',
    },
    base_address_with_script_output: {
        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
        address:
            'addr1z90z7zqwhya6mpk5q929ur897g3pp9kkgalpreny8y304r2dcrtx0sf3dluyu4erzr3xtmdnzvcyfzekkuteu2xagx0qeva0pr',
        amount: '7120787',
    },
    base_address_change_output: {
        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
        addressParameters: {
            addressType: CardanoAddressType.BASE,
            path: "m/1852'/1815'/0'/0/0",
            stakingPath: "m/1852'/1815'/0'/2/0",
        },
        amount: '7120787',
    },
    base_address_change_output_numbers: {
        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
        addressParameters: {
            addressType: CardanoAddressType.BASE,
            path: [0x80000000 + 1852, 0x80000000 + 1815, 0x80000000, 0, 0],
            stakingPath: [0x80000000 + 1852, 0x80000000 + 1815, 0x80000000, 2, 0],
        },
        amount: '7120787',
    },
    staking_key_hash_output: {
        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
        addressParameters: {
            addressType: CardanoAddressType.BASE,
            path: "m/1852'/1815'/0'/0/0",
            stakingKeyHash: '32c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dc',
        },
        amount: '7120787',
    },
    pointer_address_output: {
        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
        addressParameters: {
            addressType: CardanoAddressType.POINTER,
            path: "m/1852'/1815'/0'/0/0",
            certificatePointer: {
                blockIndex: 1,
                txIndex: 2,
                certificateIndex: 3,
            },
        },
        amount: '7120787',
    },
    enterprise_address_output: {
        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
        addressParameters: {
            addressType: CardanoAddressType.ENTERPRISE,
            path: "m/1852'/1815'/0'/0/0",
        },
        amount: '7120787',
    },
    testnet_output: {
        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
        address: '2657WMsDfac7BteXkJq5Jzdog4h47fPbkwUM49isuWbYAr2cFRHa3rURP236h9PBe',
        amount: '3003112',
    },
    shelley_testnet_output: {
        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
        address: 'addr_test1vr9s8py7y68e3x66sscs0wkhlg5ssfrfs65084jrlrqcfqqtmut0e',
        amount: '1',
    },
    token_output: {
        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
        address:
            'addr1q84sh2j72ux0l03fxndjnhctdg7hcppsaejafsa84vh7lwgmcs5wgus8qt4atk45lvt4xfxpjtwfhdmvchdf2m3u3hlsd5tq5r',
        amount: '2000000',
        tokenBundle: [
            {
                policyId: '95a292ffee938be03e9bae5657982a74e9014eb4960108c9e23a5b39',
                tokenAmounts: [
                    {
                        assetNameBytes: '74652474436f696e',
                        amount: '7878754',
                    },
                ],
            },
            {
                policyId: '96a292ffee938be03e9bae5657982a74e9014eb4960108c9e23a5b39',
                tokenAmounts: [
                    {
                        assetNameBytes: '74652474436f696e',
                        amount: '7878754',
                    },
                    {
                        assetNameBytes: '75652474436f696e',
                        amount: '1234',
                    },
                ],
            },
        ],
    },
    output_common_with_ledger: {
        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
        address:
            'addr1q84sh2j72ux0l03fxndjnhctdg7hcppsaejafsa84vh7lwgmcs5wgus8qt4atk45lvt4xfxpjtwfhdmvchdf2m3u3hlsd5tq5r',
        amount: '2000000',
        tokenBundle: [
            {
                policyId: '0d63e8d2c5a00cbcffbdf9112487c443466e1ea7d8c834df5ac5c425',
                tokenAmounts: [
                    {
                        assetNameBytes: '74657374436f696e',
                        amount: '7878754',
                    },
                ],
            },
        ],
    },
    output_with_datum_hash: {
        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
        address: 'addr1w9rhu54nz94k9l5v6d9rzfs47h7dv7xffcwkekuxcx3evnqpvuxu0',
        amount: '1',
        datumHash: '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
    },
    output_with_datum_hash_and_base_address_paramaters: {
        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
        addressParameters: {
            addressType: CardanoAddressType.BASE,
            path: "m/1852'/1815'/0'/0/0",
            stakingPath: "m/1852'/1815'/0'/2/0",
        },
        amount: '7120787',
        datumHash: '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
    },
    output_with_babbage_data: {
        format: CardanoTxOutputSerializationFormat.MAP_BABBAGE,
        address: 'addr1w9rhu54nz94k9l5v6d9rzfs47h7dv7xffcwkekuxcx3evnqpvuxu0',
        amount: '1',
        inlineDatum: 'b7',
        referenceScript:
            '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0',
    },
    output_with_long_babbage_data_and_change_address: {
        format: CardanoTxOutputSerializationFormat.MAP_BABBAGE,
        addressParameters: {
            addressType: CardanoAddressType.BASE,
            path: "m/1852'/1815'/0'/0/0",
            stakingPath: "m/1852'/1815'/0'/2/0",
        },
        amount: '1',
        inlineDatum:
            '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
        referenceScript:
            '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7b3',
    },
    babbage_output_common_with_ledger: {
        format: CardanoTxOutputSerializationFormat.MAP_BABBAGE,
        address:
            'addr1q84sh2j72ux0l03fxndjnhctdg7hcppsaejafsa84vh7lwgmcs5wgus8qt4atk45lvt4xfxpjtwfhdmvchdf2m3u3hlsd5tq5r',
        amount: '1',
        inlineDatum:
            '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
        referenceScript:
            '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b73b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7b3',
    },
};

const SAMPLE_CERTIFICATES = {
    stake_registration: {
        type: CardanoCertificateType.STAKE_REGISTRATION,
        path: "m/1852'/1815'/0'/2/0",
    },
    stake_registration_script: {
        type: CardanoCertificateType.STAKE_REGISTRATION,
        scriptHash: '29fb5fd4aa8cadd6705acc8263cee0fc62edca5ac38db593fec2f9fd',
    },
    stake_deregistration: {
        type: CardanoCertificateType.STAKE_DEREGISTRATION,
        path: "m/1852'/1815'/0'/2/0",
    },
    stake_deregistration_script: {
        type: CardanoCertificateType.STAKE_DEREGISTRATION,
        scriptHash: '29fb5fd4aa8cadd6705acc8263cee0fc62edca5ac38db593fec2f9fd',
    },
    stake_deregistration_key_hash: {
        type: CardanoCertificateType.STAKE_DEREGISTRATION,
        keyHash: '3a7f09d3df4cf66a7399c2b05bfa234d5a29560c311fc5db4c490711',
    },
    stake_delegation: {
        type: CardanoCertificateType.STAKE_DELEGATION,
        path: "m/1852'/1815'/0'/2/0",
        pool: 'f61c42cbf7c8c53af3f520508212ad3e72f674f957fe23ff0acb4973',
    },
    stake_delegation_script: {
        type: CardanoCertificateType.STAKE_DELEGATION,
        scriptHash: '29fb5fd4aa8cadd6705acc8263cee0fc62edca5ac38db593fec2f9fd',
        pool: 'f61c42cbf7c8c53af3f520508212ad3e72f674f957fe23ff0acb4973',
    },
    stake_pool_registration: {
        type: CardanoCertificateType.STAKE_POOL_REGISTRATION,
        poolParameters: {
            poolId: 'f61c42cbf7c8c53af3f520508212ad3e72f674f957fe23ff0acb4973',
            vrfKeyHash: '198890ad6c92e80fbdab554dda02da9fb49d001bbd96181f3e07f7a6ab0d0640',
            pledge: '500000000',
            cost: '340000000',
            margin: {
                numerator: '1',
                denominator: '2',
            },
            rewardAccount: 'stake1uya87zwnmax0v6nnn8ptqkl6ydx4522kpsc3l3wmf3yswygwx45el',
            owners: [
                {
                    stakingKeyPath: "m/1852'/1815'/0'/2/0",
                    stakingKeyHash: undefined,
                },
                {
                    stakingKeyHash: '3a7f09d3df4cf66a7399c2b05bfa234d5a29560c311fc5db4c490711',
                },
            ],
            relays: [
                {
                    type: 0,
                    ipv4Address: '192.168.0.1',
                    ipv6Address: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
                    port: 1234,
                },
                {
                    type: 0,
                    ipv6Address: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
                    ipv4Address: null,
                    port: 1234,
                },
                {
                    type: 0,
                    ipv4Address: '192.168.0.1',
                    port: 1234,
                },
                {
                    type: 1,
                    hostName: 'www.test.test',
                    port: 1234,
                },
                {
                    type: 2,
                    hostName: 'www.test2.test',
                },
            ],
            metadata: {
                url: 'https://www.test.test',
                hash: '914c57c1f12bbf4a82b12d977d4f274674856a11ed4b9b95bd70f5d41c5064a6',
            },
        },
    },
    stake_pool_registration_no_metadata: {
        type: CardanoCertificateType.STAKE_POOL_REGISTRATION,
        poolParameters: {
            poolId: 'f61c42cbf7c8c53af3f520508212ad3e72f674f957fe23ff0acb4973',
            vrfKeyHash: '198890ad6c92e80fbdab554dda02da9fb49d001bbd96181f3e07f7a6ab0d0640',
            pledge: '500000000',
            cost: '340000000',
            margin: {
                numerator: '1',
                denominator: '2',
            },
            rewardAccount: 'stake1uya87zwnmax0v6nnn8ptqkl6ydx4522kpsc3l3wmf3yswygwx45el',
            owners: [
                {
                    stakingKeyPath: "m/1852'/1815'/0'/2/0",
                },
            ],
            relays: [],
            metadata: null,
        },
    },
};

const SAMPLE_WITHDRAWALS = {
    basic: {
        path: "m/1852'/1815'/0'/2/0",
        amount: '1000',
    },
    script: {
        scriptHash: '29fb5fd4aa8cadd6705acc8263cee0fc62edca5ac38db593fec2f9fd',
        amount: '1000',
    },
    key_hash: {
        keyHash: '3a7f09d3df4cf66a7399c2b05bfa234d5a29560c311fc5db4c490711',
        amount: '1000',
    },
};

const SAMPLE_MINTS = {
    basic: [
        {
            policyId: '95a292ffee938be03e9bae5657982a74e9014eb4960108c9e23a5b39',
            tokenAmounts: [
                {
                    assetNameBytes: '74652474436f696e',
                    mintAmount: '7878754',
                },
                {
                    assetNameBytes: '75652474436f696e',
                    mintAmount: '-7878754',
                },
            ],
        },
        {
            policyId: '96a292ffee938be03e9bae5657982a74e9014eb4960108c9e23a5b39',
            tokenAmounts: [
                {
                    assetNameBytes: '74652474436f696e',
                    mintAmount: '7878754',
                },
                {
                    assetNameBytes: '75652474436f696e',
                    mintAmount: '-1234',
                },
            ],
        },
    ],
    common_with_ledger: [
        {
            policyId: '0d63e8d2c5a00cbcffbdf9112487c443466e1ea7d8c834df5ac5c425',
            tokenAmounts: [
                {
                    assetNameBytes: '74657374436f696e',
                    mintAmount: '7878754',
                },
                {
                    assetNameBytes: '75657374436f696e',
                    mintAmount: '-7878754',
                },
            ],
        },
    ],
};

const FEE = '42';
const TTL = '10';
const VALIDITY_INTERVAL_START = '47';
const SCRIPT_DATA_HASH = 'd593fd793c377ac50a3169bb8378ffc257c944da31aa8f355dfa5a4f6ff89e02';
const TOTAL_COLLATERAL = '1000';

const legacyResults = {
    beforeTransactionStreaming: {
        // FW without transaction streaming is no longer supported by Connect
        rules: ['<2.4.2', '1'],
        success: false,
    },
    beforeMultisig: {
        // older FW doesn't support multisig
        rules: ['<2.4.3', '1'],
        payload: false,
    },
    beforePlutus: {
        // older FW doesn't support plutus-related features (OutputDatumHash, ScriptDataHash,
        // Plutus, KeyHashStakeCredential)
        rules: ['<2.4.4', '1'],
        payload: false,
    },
    beforeBabbage: {
        // older FW doesn't support babbage-related features (inlineDatum, referenceScript, collateralReturn,
        // totalCollateral, referenceInputs)
        rules: ['<2.5.2', '1'],
        payload: false,
    },
    beforeCIP36Registration: {
        // older FW doesn't support CIP36 registration format
        rules: ['<2.5.3', '1'],
        payload: false,
    },
    beforeCIP36RegistrationExternalPaymentAddress: {
        // older FW doesn't support payment address given as a string in vote key registrations
        rules: ['<2.5.4', '1'],
        payload: false,
    },
};

export default {
    method: 'cardanoSignTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'signMainnetNoChange',
            params: {
                inputs: [SAMPLE_INPUTS.byron_input],
                outputs: [SAMPLE_OUTPUTS.simple_byron_output],
                fee: FEE,
                ttl: TTL,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: '73e09bdebf98a9e0f17f86a2d11e0f14f4f8dae77cdf26ff1678e821f20c8db6',
                witnesses: [
                    {
                        type: 0,
                        pubKey: '89053545a6c254b0d9b1464e48d2b5fcf91d4e25c128afb1fcfc61d0843338ea',
                        signature:
                            'da07ac5246e3f20ebd1276476a4ae34a019dd4b264ffc22eea3c28cb0f1a6bb1c7764adeecf56bcb0bc6196fd1dbe080f3a7ef5b49f56980fe5b2881a4fdfa00',
                        chainCode:
                            '26308151516f3b0e02bb1638142747863c520273ce9bd3e5cd91e1d46fe2a635',
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeTransactionStreaming],
        },

        {
            description: 'signMainnetChange',
            params: {
                inputs: [SAMPLE_INPUTS.byron_input],
                outputs: [SAMPLE_OUTPUTS.simple_byron_output, SAMPLE_OUTPUTS.byron_change_output],
                fee: FEE,
                ttl: TTL,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: '81b14b7e62972127eb33c0b1198de6430540ad3a98eec621a3194f2baac43a43',
                witnesses: [
                    {
                        type: 0,
                        pubKey: '89053545a6c254b0d9b1464e48d2b5fcf91d4e25c128afb1fcfc61d0843338ea',
                        signature:
                            'd909b16038c4fd772a177038242e6793be39c735430b03ee924ed18026bd28d06920b5846247945f1204276e4b759aa5ac05a4a73b49ce705ab0e5e54a3a170e',
                        chainCode:
                            '26308151516f3b0e02bb1638142747863c520273ce9bd3e5cd91e1d46fe2a635',
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeTransactionStreaming],
        },

        {
            description: 'signMainnetBaseAddress',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [
                    SAMPLE_OUTPUTS.simple_shelley_output,
                    SAMPLE_OUTPUTS.base_address_change_output,
                ],
                fee: FEE,
                ttl: TTL,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: '16fe72bb198be423677577e6326f1f648ec5fc11263b072006382d8125a6edda',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '6a78f07836dcf4a303448d2b16b217265a9226be3984a69a04dba5d04f4dbb2a47b5e1cbb345f474c0b9634a2f37b921ab26e6a65d5dfd015dacb4455fb8430a',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeTransactionStreaming],
        },

        {
            description: 'signMainnetBaseHashAddress',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [
                    SAMPLE_OUTPUTS.simple_shelley_output,
                    SAMPLE_OUTPUTS.staking_key_hash_output,
                ],
                fee: FEE,
                ttl: TTL,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: 'd1610bb89bece22ed3158738bc1fbb31c6af0685053e2993361e3380f49afad9',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '622f22d03bc9651ddc5eb2f5dc709ac4240a64d2b78c70355dd62106543c407d56e8134c4df7884ba67c8a1b5c706fc021df5c4d0ff37385c30572e73c727d00',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeTransactionStreaming],
        },

        {
            description: 'signMainnetPointerAddress',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [
                    SAMPLE_OUTPUTS.simple_shelley_output,
                    SAMPLE_OUTPUTS.pointer_address_output,
                ],
                fee: FEE,
                ttl: TTL,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: '40535fa8f88515f1da008d3cdf544cf9dbf1675c3cb0adb13b74b9293f1b7096',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            'dbbf050cc13d0696b1884113613318a275e6f0f8c7cb3e7828c4f2f3c158b2622a5d65ea247f1eed758a0f6242a52060c319d6f37c8460f5d14be24456cd0b08',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeTransactionStreaming],
        },

        {
            description: 'signMainnetEnterpriseAddress',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [
                    SAMPLE_OUTPUTS.simple_shelley_output,
                    SAMPLE_OUTPUTS.enterprise_address_output,
                ],
                fee: FEE,
                ttl: TTL,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: 'd3570557b197604109481a80aeb66cd2cfabc57f802ad593bacc12eb658e5d72',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            'c5996650c438c4493b2c8a94229621bb9b151b8d61d75fb868c305e917031e9a1654f35023f7dbf5d1839ab9d57b153c7f79c2666af51ecf363780397956e00a',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeTransactionStreaming],
        },

        {
            description: 'signStakeRegistration',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                certificates: [SAMPLE_CERTIFICATES.stake_registration],
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: '1a3a295908afd8b2afc368071272d6964be6ee0af062bb765aea65ca454dc0c9',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            'a938b16bd81aea8d3aaf11e4d460dad1f36d34bf34ad066d0f5ce5d4137654145d998c3482aa823ff1acf021c6e2cd2774fff00361cbb9e72b98632307ee4000',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeTransactionStreaming],
        },

        {
            description: 'signStakeRegistrationNoOutputs',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [],
                fee: FEE,
                ttl: TTL,
                certificates: [SAMPLE_CERTIFICATES.stake_registration],
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: '03535791d04fc1b4457fada025f1c1f7778b5c2d7fa580bbac8abd53b85d3255',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '47e6e902e81bbba5596cfabaa4f9a70f36b367e28ee81181771ccd32d38b19c1d8ae9b0afb2a79057b87f8de7862e8d2317d86246909aaa66e54445d47aa990b',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeTransactionStreaming],
        },

        {
            description: 'signStakeRegistrationAndDelegation',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                certificates: [
                    SAMPLE_CERTIFICATES.stake_registration,
                    SAMPLE_CERTIFICATES.stake_delegation,
                ],
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: '439764b5f7e08839881536a3191faeaf111e75d9f00f83b102c5c1c6fa9fcaf9',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '5ebe8eff752f07e8448f55304fdf3665ac68162099dcacd81886b73affe67fb6df401f8a5fa60ddb6d5fb65b93235e6a234182a40c001e3cf7634f82afd5fe0a',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'bc65be1b0b9d7531778a1317c2aa6de936963c3f9ac7d5ee9e9eda25e0c97c5e',
                        signature:
                            '0dbdf36f92bc5199526ffb8b83b33a9eeda0ed3e46fb4025a104346801afb9cf45fa1a5482e54c769f4102e67af46205457d7ae05a889fc342acb0cdc23ecd03',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeTransactionStreaming],
        },

        {
            description: 'signStakeDeregistration',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                certificates: [SAMPLE_CERTIFICATES.stake_deregistration],
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: '3aca1784d151dc75bdbb80fae71bda3f4b26af3f5fd71bd5e9e9bbcdd2b64ad1',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            'e563a8012e16affd801564e8410ca7b2c96f76f8ecb878e35c098a823c40be7f59dc12cb44a9b678210d4e8f18ab215133eef7ca9ece94b4683d3db0fd37e105',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'bc65be1b0b9d7531778a1317c2aa6de936963c3f9ac7d5ee9e9eda25e0c97c5e',
                        signature:
                            '84f321d313da67f80f7fab2e4f3996d3dbe3186659e6f98315e372dbe88c55d56f637ccc7534890c3601ddd31ba885dc86ba0074c230869f20099b7dd5eeaf00',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeTransactionStreaming],
        },

        {
            description: 'signStakeDeregistrationAndWithdrawal',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                certificates: [SAMPLE_CERTIFICATES.stake_deregistration],
                withdrawals: [SAMPLE_WITHDRAWALS.basic],
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: '22c67f12e6f6aa0f2f09fd27d472b19c7208ccd7c3af4b09604fd5d462c1de2b',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '7efa634e42fa844cad5f60bf005d645817cc674f30eaab0da398b99034850780b40ab5a1028da033330a0f82b01648ec92cff8ca85a072594efb298016f38d0d',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'bc65be1b0b9d7531778a1317c2aa6de936963c3f9ac7d5ee9e9eda25e0c97c5e',
                        signature:
                            '0202826a8b9688cf978000e7d1591582c65b149bb9f55dc883ae1acf85432618ca32be8a06fef37e69df503a294e7093006f63ababf9fcea639390226934020a',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeTransactionStreaming],
        },

        {
            description: 'signMetadata',
            skip: ['>2.3.6'],
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                metadata:
                    'a200a11864a118c843aa00ff01a119012c590100aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: false,
        },

        {
            description: 'signAuxiliaryData with blob instead of hash',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                auxiliaryData: {
                    blob: 'a200a11864a118c843aa00ff01a119012c590100aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: false,
        },

        {
            description: 'signAuxiliaryData',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                auxiliaryData: {
                    hash: 'ea4c91860dd5ec5449f8f985d227946ff39086b17f10b5afb93d12ee87050b6a',
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: '1875f1d59a53f1cb4c43949867d72bcfd857fa3b64feb88f41b78ddaa1a21cbf',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            'b2015772a91043aeb04b98111744a098afdade0db5e30206538d7f2814965a5800d45240137f4d0dc81845a71e67cda38beaf816a520d73c4decbf7cbf0f6d08',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeTransactionStreaming],
        },

        {
            description: 'signCVoteRegistrationWithPath',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                auxiliaryData: {
                    cVoteRegistrationParameters: {
                        votePublicKey:
                            '1af8fa0b754ff99253d983894e63a2b09cbb56c833ba18c3384210163f63dcfc',
                        stakingPath: "m/1852'/1815'/0'/2/0",
                        paymentAddressParameters: {
                            addressType: CardanoAddressType.REWARD,
                            path: "m/1852'/1815'/0'/2/0",
                        },
                        nonce: '22634813',
                    },
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: '7ab0767e0142e1d53b534f5bad053273709ad5ca4037aef20f205fffd44a8463',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            'bab6bd91c481ee822258e2a7d31a33bfc40ddbfb09147f19f07de690eeae431d2349752f9f77c58df25a68310f7a15f56d12fab5acd20c5ccaded6c263f8240c',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: {
                    type: 1,
                    auxiliaryDataHash:
                        'b712ad07750007ba68d7558abeeab103b36a09133062ba9fa6611953085d9137',
                    cVoteRegistrationSignature:
                        'ed3335aead65c665ceee21f2549c0ef4c9137b94c13fa642bea4a2c24e44e7f1ee06b47e14151efcf8d5569a404260c01f277b3ba516b5826a15c8ba2c97f70c',
                },
            },
            legacyResults: [legacyResults.beforeTransactionStreaming],
        },

        {
            description: 'signCVoteRegistrationWithStakingPath',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                auxiliaryData: {
                    cVoteRegistrationParameters: {
                        votePublicKey:
                            '1af8fa0b754ff99253d983894e63a2b09cbb56c833ba18c3384210163f63dcfc',
                        stakingPath: "m/1852'/1815'/0'/2/0",
                        paymentAddressParameters: {
                            addressType: CardanoAddressType.REWARD,
                            stakingPath: "m/1852'/1815'/0'/2/0",
                        },
                        nonce: '22634813',
                    },
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: '7ab0767e0142e1d53b534f5bad053273709ad5ca4037aef20f205fffd44a8463',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            'bab6bd91c481ee822258e2a7d31a33bfc40ddbfb09147f19f07de690eeae431d2349752f9f77c58df25a68310f7a15f56d12fab5acd20c5ccaded6c263f8240c',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: {
                    type: 1,
                    auxiliaryDataHash:
                        'b712ad07750007ba68d7558abeeab103b36a09133062ba9fa6611953085d9137',
                    cVoteRegistrationSignature:
                        'ed3335aead65c665ceee21f2549c0ef4c9137b94c13fa642bea4a2c24e44e7f1ee06b47e14151efcf8d5569a404260c01f277b3ba516b5826a15c8ba2c97f70c',
                },
            },
            legacyResults: [legacyResults.beforeTransactionStreaming],
        },

        {
            description: 'signTransactionWithCIP36RegistrationAndVotingPurposeNotSpecified',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                auxiliaryData: {
                    cVoteRegistrationParameters: {
                        stakingPath: "m/1852'/1815'/0'/2/0",
                        paymentAddressParameters: {
                            addressType: CardanoAddressType.BASE,
                            path: "m/1852'/1815'/0'/0/0",
                            stakingPath: "m/1852'/1815'/0'/2/0",
                        },
                        nonce: '22634813',
                        format: CardanoCVoteRegistrationFormat.CIP36,
                        delegations: [
                            {
                                votePublicKey:
                                    '1af8fa0b754ff99253d983894e63a2b09cbb56c833ba18c3384210163f63dcfc',
                                weight: 1,
                            },
                            {
                                votePublicKey:
                                    '2af8fa0b754ff99253d983894e63a2b09cbb56c833ba18c3384210163f63dcfc',
                                weight: 2,
                            },
                        ],
                    },
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: '15e4e382d913a743776b93d730fee3ca39bfa3ee203801205333bc9aad249612',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            'c984c65a5d6ee16c9cdd9fd332a5f64907f25438ef2d1e6d625bdd5c76d15acdf3e5700338b6b5c0ca30d25dd604e1b33ab5ee3459ff8ce3ca5a11e774a18605',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: {
                    type: 1,
                    auxiliaryDataHash:
                        '9d4c00f5b5b67760931fd7ed9850ff8e14dcdf957685191ab4bc755c52f0ed56',
                    cVoteRegistrationSignature:
                        '2671b8e668ffce235647ac89deda6cc222e7b31a3d44606c2723fcf711b29f9af1e30b0c6b4f87ba37ddf9f6adf0226c39c09e655255890644a3dc4e64c3a001',
                },
            },
            legacyResults: [legacyResults.beforeCIP36Registration],
        },

        {
            description: 'signTransactionWithCIP36RegistrationAndOtherVotingPurpose',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                auxiliaryData: {
                    cVoteRegistrationParameters: {
                        stakingPath: "m/1852'/1815'/0'/2/0",
                        paymentAddressParameters: {
                            addressType: CardanoAddressType.BASE,
                            path: "m/1852'/1815'/0'/0/0",
                            stakingPath: "m/1852'/1815'/0'/2/0",
                        },
                        nonce: '22634813',
                        format: CardanoCVoteRegistrationFormat.CIP36,
                        delegations: [
                            {
                                votePublicKey:
                                    '1af8fa0b754ff99253d983894e63a2b09cbb56c833ba18c3384210163f63dcfc',
                                weight: 1,
                            },
                        ],
                        votingPurpose: 1,
                    },
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: '98357cec961c4c2bfef747bb204a06945ab55077166ec4367b644882136b8b39',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '9ac45a56c7002a8bca2121b9f0bae52a7201336b7528495c22d49b845b514d93a70ca1571e8a4dd418fbf4c260018c264843e54fbd2a8c6486e8f00f93cd5103',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: {
                    type: 1,
                    auxiliaryDataHash:
                        '28b7ffa6800833bdfe5421739eaa21d4a49cde1d84e762b147001169f7c0a385',
                    cVoteRegistrationSignature:
                        'ebc00c615f988c6fc2e132d4419a719f04bbec56fe2569a00746a9e9b0d6e5bdd0809515cb2522c773c991c5ae39834403654d36b37e70b14897c0e98c8c0a0c',
                },
            },
            legacyResults: [legacyResults.beforeCIP36Registration],
        },

        {
            description: 'signTransactionWithCIP36RegistrationAndExternalPaymentAddress',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                auxiliaryData: {
                    cVoteRegistrationParameters: {
                        stakingPath: "m/1852'/1815'/0'/2/0",
                        nonce: '22634813',
                        format: CardanoCVoteRegistrationFormat.CIP36,
                        delegations: [
                            {
                                votePublicKey:
                                    '1af8fa0b754ff99253d983894e63a2b09cbb56c833ba18c3384210163f63dcfc',
                                weight: 1,
                            },
                        ],
                        paymentAddress:
                            'addr1q84sh2j72ux0l03fxndjnhctdg7hcppsaejafsa84vh7lwgmcs5wgus8qt4atk45lvt4xfxpjtwfhdmvchdf2m3u3hlsd5tq5r',
                    },
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: 'a5c5506777fb62aa98e6c45f1c85ab9ddf706a1f199e777c43f2288a6b4fdcab',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '98e68184bc090fe95c461bd8d26b462861d382dbfce051bc9cb04a7d51c2ba293960e19ac9099c6d10912c89a3102fcd958c31e87eb9e142136b6411ab55f107',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: {
                    type: 1,
                    auxiliaryDataHash:
                        '3830a90f2c5dc23ddd478cefcb8642f0b36afa77769239146d9cba83ed196e41',
                    cVoteRegistrationSignature:
                        'ba05ac525e5dcc74e5a6cdbb7fb111d8e21163d79fe76777a5b730fe93512f09415f6f7b4904b12c6f12fe33b6c553d9889beb024299fa1256a0d3e98c8ff203',
                },
            },
            legacyResults: [legacyResults.beforeCIP36RegistrationExternalPaymentAddress],
        },

        {
            description: 'signOutputWithDatumHash',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.output_with_datum_hash],
                fee: FEE,
                ttl: TTL,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: '8ea2765f1e46d84f02d8b25a5f0cf445aaeaadcab913e17e59388a4f898ca812',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            'ccc4e3c2adbf63561881212c8dffd42a02850460256da9b393aaed2cbd131fbb2798a92a2adf59c31d22e1e33c3dad011d91e09aa2d5b15ba64fa995bf241900',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforePlutus],
        },

        {
            description: 'signScriptDataHash',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                scriptDataHash: SCRIPT_DATA_HASH,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: '8606e5b69b5c40bd359d7bad6ed6f77810b8e8acba6cbca298c13f92b11178d4',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            'c8676cf593554f347e2d6a5ffc6a1371638156eaaddb3e7f94ae9a7488a6adb01c3660d8aff1da08e01c4899615158e69c5c797841ef7747740ab56d3b452f0c',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforePlutus],
        },

        {
            description: 'signTestnet',
            params: {
                inputs: [SAMPLE_INPUTS.byron_input],
                outputs: [
                    SAMPLE_OUTPUTS.testnet_output,
                    SAMPLE_OUTPUTS.shelley_testnet_output,
                    SAMPLE_OUTPUTS.byron_change_output,
                ],
                fee: FEE,
                ttl: TTL,
                protocolMagic: 42,
                networkId: NETWORK_IDS.testnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: '47cf79f20c6c62edb4162b3b232a57afc1bd0b57c7fd8389555276408a004776',
                witnesses: [
                    {
                        type: 0,
                        pubKey: '89053545a6c254b0d9b1464e48d2b5fcf91d4e25c128afb1fcfc61d0843338ea',
                        signature:
                            'cc11adf81cb3c3b75a438325f8577666f5cbb4d5d6b73fa6dbbcf5ab36897df34eecacdb54c3bc3ce7fc594ebb2c7aa4db4700f4290facad9b611a035af8710a',
                        chainCode:
                            '26308151516f3b0e02bb1638142747863c520273ce9bd3e5cd91e1d46fe2a635',
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeTransactionStreaming],
        },

        {
            description: 'signStakePoolRegistration',
            params: {
                inputs: [SAMPLE_INPUTS.external_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                certificates: [SAMPLE_CERTIFICATES.stake_pool_registration],
                signingMode: CardanoTxSigningMode.POOL_REGISTRATION_AS_OWNER,
            },
            result: {
                hash: 'e3b9a5657bf62609465a930c8359d774c73944973cfc5a104a0f0ed1e1e8db21',
                witnesses: [
                    {
                        type: 1,
                        pubKey: 'bc65be1b0b9d7531778a1317c2aa6de936963c3f9ac7d5ee9e9eda25e0c97c5e',
                        signature:
                            '06305b52f76d2d2da6925c02036a9a28456976009f8c6432513f273110d09ea26db79c696cec322b010e5cbb7d90a6b473b157e65df846a1487062569a5f5a04',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeTransactionStreaming],
        },

        {
            description: 'signStakePoolRegistrationNoMetadata',
            params: {
                inputs: [SAMPLE_INPUTS.external_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                certificates: [SAMPLE_CERTIFICATES.stake_pool_registration_no_metadata],
                signingMode: CardanoTxSigningMode.POOL_REGISTRATION_AS_OWNER,
            },
            result: {
                hash: '504f9214142996e0b7e315103b25d88a4afa3d01dd5be22376921b52b01483c3',
                witnesses: [
                    {
                        type: 1,
                        pubKey: 'bc65be1b0b9d7531778a1317c2aa6de936963c3f9ac7d5ee9e9eda25e0c97c5e',
                        signature:
                            'aa2099208399fcc27c18d7ef0c7e873f9e22f0935b7e912cddd34b33b8cafd541a878dc01c042ce490e4c9bad3c62c2f59acaa009d336c9ff875c5f153d34900',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeTransactionStreaming],
        },

        {
            description: 'signMaryWithValidityIntervalStart',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                validityIntervalStart: VALIDITY_INTERVAL_START,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: 'ab331c5a1b098763e20cd85aecb65e2364ceb4b35db56e1fb3c36c8d508c9cec',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '476b84a2d93c0b1f3f9cc29248ad1e7c11ccd7e2dd69b33e753cb12f52fe57630a1dcc75284a2d863fbbe47df29c0662b62f0498519b77e797b115095095f60f',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [
                {
                    // older FW doesn't support validity interval start
                    rules: ['<2.3.5', '1'],
                    payload: false,
                },
            ],
        },

        {
            description: 'signMaryTokenSending',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.token_output],
                fee: FEE,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: 'b6cbcb21d6622b81c37a721e37a704524fa4dc10a0b4afc2288c676e8a6ac288',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '613cf030d3edd562ae1d003e615baa03e41f96f4a470cf854d9588c8da3bcbe09228c064e42eaf101fc4c82fcae1d93cedf160e5465d4f1fd47dd6dacc1cf403',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [
                {
                    // older FW doesn't support multiasset outputs
                    rules: ['<2.3.5', '1'],
                    payload: false,
                },
            ],
        },

        {
            description: 'ordinaryTransactionWithTokenMinting',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.token_output],
                fee: FEE,
                ttl: TTL,
                validityIntervalStart: VALIDITY_INTERVAL_START,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
                mint: SAMPLE_MINTS.basic,
                additionalWitnessRequests: ["m/1855'/1815'/0'"],
            },
            result: {
                hash: '042c1d3a6eab693d2ea6b186a88aed038159e7eb581da80464bca7339fb9afe0',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            'ff10637250efa74970675169585720dd5b663c49ecf523ac6214e11a74858f80ec6ef4c86ea66666ec7102fe78c92bcc4e76d50a7bff1fd9660757e94863ba09',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'b75258e4f61eb7b313d8554c2fe10673cf214ca2d762bfd53ec3b7846e2ee872',
                        signature:
                            'd42665ef7855bfe6898b440476ec8967f8ce786a30865a27e0c091b912b8fd87cad2f7d2f1adeb0e2a7201f2ca020a41f48fb982cb3b7f278dab848192d42e0d',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [
                {
                    // older FW doesn't support token minting
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },

        {
            description: 'multisigTransactionWithTokenMinting',
            params: {
                inputs: [SAMPLE_INPUTS.external_input],
                outputs: [SAMPLE_OUTPUTS.token_output],
                fee: FEE,
                ttl: TTL,
                validityIntervalStart: VALIDITY_INTERVAL_START,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.MULTISIG_TRANSACTION,
                mint: SAMPLE_MINTS.basic,
                additionalWitnessRequests: ["m/1854'/1815'/0'/0/0", "m/1855'/1815'/0'"],
            },
            result: {
                hash: '042c1d3a6eab693d2ea6b186a88aed038159e7eb581da80464bca7339fb9afe0',
                witnesses: [
                    {
                        type: 1,
                        pubKey: 'b10be5c0d11ad8292bbe69e220ca0cfbe154610b3041a8e72f9d515c226ab3b1',
                        signature:
                            'ef08436c998df4fd4aade2ce240d92d8851783b688a949c167aa070e885ffb592943767ddae0b826265a307405cf9865b6f66fbfa2e5a39797950104b7b13d0d',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'b75258e4f61eb7b313d8554c2fe10673cf214ca2d762bfd53ec3b7846e2ee872',
                        signature:
                            'd42665ef7855bfe6898b440476ec8967f8ce786a30865a27e0c091b912b8fd87cad2f7d2f1adeb0e2a7201f2ca020a41f48fb982cb3b7f278dab848192d42e0d',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeMultisig],
        },

        {
            description: 'multisigWithStakeRegistration',
            params: {
                inputs: [SAMPLE_INPUTS.external_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                certificates: [SAMPLE_CERTIFICATES.stake_registration_script],
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.MULTISIG_TRANSACTION,
                additionalWitnessRequests: ["m/1854'/1815'/0'/0/0"],
            },
            result: {
                hash: 'ed9fc2755091fa72b58e9dd06db05cce87c0c6f3962f587d5fc348fe478f0752',
                witnesses: [
                    {
                        type: 1,
                        pubKey: 'b10be5c0d11ad8292bbe69e220ca0cfbe154610b3041a8e72f9d515c226ab3b1',
                        signature:
                            'dccfcce8a2a17673c0e465a60a334eabbe326127d3dd04b727702ea486ed7c231259353c0890cfcb8209169eda7a139aeec42c77ce87231b0b9c250efb64450e',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeMultisig],
        },

        {
            description: 'multisigWithStakeRegistrationAndStakeDelegation',
            params: {
                inputs: [SAMPLE_INPUTS.external_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                certificates: [
                    SAMPLE_CERTIFICATES.stake_registration_script,
                    SAMPLE_CERTIFICATES.stake_delegation_script,
                ],
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.MULTISIG_TRANSACTION,
                additionalWitnessRequests: ["m/1854'/1815'/0'/0/0", "m/1854'/1815'/0'/2/0"],
            },
            result: {
                hash: '26fb07b23368898665829283985ffe6c4cb2ec13758e83f467b78e5061f9619b',
                witnesses: [
                    {
                        type: 1,
                        pubKey: 'b10be5c0d11ad8292bbe69e220ca0cfbe154610b3041a8e72f9d515c226ab3b1',
                        signature:
                            'c3fc7aae0a78b3b888f68775da3b9ba1e5478f2003e8c1f0b558172acd23205f2652e7e021f5041a4a1a785fad4f711ca80a9b39afd2939644d4da47d86f7b05',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'f2ef4ecd21ad28a8d270ca7be7e96c87f60dc821e13c0d0c5870344e9693637c',
                        signature:
                            '982247b7a3a3625eaae74d4710f0d9a9b4bae6f0e201c31544f056ad3d7e5940e477cedf3f83fa0e37152e5f97585d910296e95395677dee047e204864187f09',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeMultisig],
        },

        {
            description: 'multisigWithStakeDeregistration',
            params: {
                inputs: [SAMPLE_INPUTS.external_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                certificates: [SAMPLE_CERTIFICATES.stake_deregistration_script],
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.MULTISIG_TRANSACTION,
                additionalWitnessRequests: ["m/1854'/1815'/0'/0/0", "m/1854'/1815'/0'/2/0"],
            },
            result: {
                hash: 'c4e70484c964eca910219047542632ac9a9ac81f11f5d5afd8bb1b0ef4366d69',
                witnesses: [
                    {
                        type: 1,
                        pubKey: 'b10be5c0d11ad8292bbe69e220ca0cfbe154610b3041a8e72f9d515c226ab3b1',
                        signature:
                            '059fa17fb8e8302083d110ec4587d6ce80b3bc15baa75e0a2d449df190ce462d0e6ebc67d96f74fa6ce0b149714d1ef24f40c24846fef9d58405c6e2287e540b',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'f2ef4ecd21ad28a8d270ca7be7e96c87f60dc821e13c0d0c5870344e9693637c',
                        signature:
                            'dc51848d3257f8f6783d6a53736ba638bc62c7098e5ec6d4d2b313520c78c689942f6e2542ba2b6b9749b7a57d4c8658c84fbc5b1e2847159eb0c256298bcd01',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeMultisig],
        },

        {
            description: 'multisigWithStakeDeregistrationAndWithdrawal',
            params: {
                inputs: [SAMPLE_INPUTS.external_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                certificates: [SAMPLE_CERTIFICATES.stake_deregistration_script],
                withdrawals: [SAMPLE_WITHDRAWALS.script],
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.MULTISIG_TRANSACTION,
                additionalWitnessRequests: ["m/1854'/1815'/0'/0/0", "m/1854'/1815'/0'/2/0"],
            },
            result: {
                hash: 'e02d252c5cad2a4d8f163069cd7f0822c7876d16af9ad8ac2d461655812b2d1b',
                witnesses: [
                    {
                        type: 1,
                        pubKey: 'b10be5c0d11ad8292bbe69e220ca0cfbe154610b3041a8e72f9d515c226ab3b1',
                        signature:
                            '882994b27b1886a2f7ae3b42e08f3ce2c9c5b7d82e467135e0069f396a18f89696e882dbeadce0b3af8a10edbfb55057e6909e8232ac0107cc4fbf647493720b',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'f2ef4ecd21ad28a8d270ca7be7e96c87f60dc821e13c0d0c5870344e9693637c',
                        signature:
                            'cc119eb4e7f27d5c316a5d1301850a2f3e4d08c267d5422cae8e4f00178a55d053a2288ed0a55fc8ec05bd8c1cd5fee5a713da85d489a2a02ac273866e36ae06',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeMultisig],
        },

        {
            description: 'multisigWithMostElementsFilledAndSharedWithLedger',
            params: {
                inputs: [SAMPLE_INPUTS.external_input],
                outputs: [
                    SAMPLE_OUTPUTS.output_common_with_ledger,
                    SAMPLE_OUTPUTS.output_with_datum_hash,
                ],
                fee: FEE,
                ttl: TTL,
                validityIntervalStart: VALIDITY_INTERVAL_START,
                certificates: [
                    SAMPLE_CERTIFICATES.stake_registration_script,
                    SAMPLE_CERTIFICATES.stake_deregistration_script,
                    SAMPLE_CERTIFICATES.stake_delegation_script,
                ],
                withdrawals: [SAMPLE_WITHDRAWALS.script],
                auxiliaryData: {
                    hash: '58ec01578fcdfdc376f09631a7b2adc608eaf57e3720484c7ff37c13cff90fdf',
                },
                mint: SAMPLE_MINTS.common_with_ledger,
                scriptDataHash: '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.MULTISIG_TRANSACTION,
                additionalWitnessRequests: [
                    "m/1854'/1815'/0'/0/0",
                    "m/1854'/1815'/0'/2/0",
                    "m/1855'/1815'/0'",
                ],
                includeNetworkId: true,
            },
            result: {
                hash: 'c3637e34529fae17dbbb90c58307df0cf3b818f4c034860fff362d1ea864cca4',
                witnesses: [
                    {
                        type: 1,
                        pubKey: 'b10be5c0d11ad8292bbe69e220ca0cfbe154610b3041a8e72f9d515c226ab3b1',
                        signature:
                            '58bc9f1c39f2cd4248ad79a5f6a4733a6e751e86b09163e468b92ec1079590f6052f30f9a782812ba1b553f1c5f22cad807af97494cf8a0a26bf123bc2f60202',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'f2ef4ecd21ad28a8d270ca7be7e96c87f60dc821e13c0d0c5870344e9693637c',
                        signature:
                            '8b3e5b1b013d7456c1b0d67a334af725e3e1d3ea9a4a8ff05889314691f797cb49fff2cc10764133bce154db5e0eb91e4c1982cf53e6578648cf1f251f37020a',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'b75258e4f61eb7b313d8554c2fe10673cf214ca2d762bfd53ec3b7846e2ee872',
                        signature:
                            'cb3daca29e217a9f0c7e5ad47b0d07827ce8937d252ba6e32415f4613e8e6675e1b3964d28b354d338bae623bba1c30bf47a37818b56602a6e7ba7ff081aa605',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforePlutus],
        },

        {
            description: 'signTtlIs0',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [
                    SAMPLE_OUTPUTS.simple_shelley_output,
                    SAMPLE_OUTPUTS.base_address_change_output,
                ],
                fee: FEE,
                ttl: '0',
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: 'f4b7315ec080d05024d1f7bf6795dd234c6624970d8e272a245702de539feaa2',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '60728614d19e61dbcf5b9258b361f1e5b8d398c85f7c43ff1eff266d736826a80e3ecd038ca6d3a40609ffa3fc062581c3490068d25a799e88cf74840451540a',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [
                {
                    // older FW doesn't support a zero ttl
                    rules: ['<2.4.2', '1'],
                    payload: false,
                },
            ],
        },

        {
            description: 'signValidityIntervalIs0',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [
                    SAMPLE_OUTPUTS.simple_shelley_output,
                    SAMPLE_OUTPUTS.base_address_change_output,
                ],
                fee: FEE,
                ttl: TTL,
                validityIntervalStart: '0',
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: 'cabc87a76ad8944e8a97a7cbf9c893a77ed7d1bd963c428c3786d663adb7f0dd',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            'a1f28828038757949ac319ca24bcd41d6af41ced07db20d5b6ed7392e4b6aa663ee92e873fa571a257ddeef945bee76694107da50edbd4f6c12b8654e0a22b02',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [
                {
                    // older FW doesn't support a zero validityIntervalStart
                    rules: ['<2.4.2', '1'],
                    payload: false,
                },
            ],
        },

        {
            description: 'signWithEverythingSetExceptPoolRegistrationCertificate',
            customTimeout: 40000,
            params: {
                inputs: [
                    {
                        path: "m/1852'/1815'/0'/0/0",
                        prev_hash:
                            'd593fd793c377ac50a3169bb8378ffc257c944da31aa8f355dfa5a4f6ff89e02',
                        prev_index: 0,
                    },
                    {
                        path: "m/1852'/1815'/0'/0/1",
                        prev_hash:
                            'd593fd793c377ac50a3169bb8378ffc257c944da31aa8f355dfa5a4f6ff89e02',
                        prev_index: 0,
                    },
                    {
                        path: "m/1852'/1815'/0'/0/2",
                        prev_hash:
                            'd593fd793c377ac50a3169bb8378ffc257c944da31aa8f355dfa5a4f6ff89e02',
                        prev_index: 0,
                    },
                ],
                outputs: [
                    {
                        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
                        address:
                            'addr1q84sh2j72ux0l03fxndjnhctdg7hcppsaejafsa84vh7lwgmcs5wgus8qt4atk45lvt4xfxpjtwfhdmvchdf2m3u3hlsd5tq5r',
                        amount: '1234',
                    },
                    {
                        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
                        addressParameters: {
                            addressType: CardanoAddressType.BASE,
                            path: "m/1852'/1815'/0'/0/0",
                            stakingPath: "m/1852'/1815'/0'/2/0",
                        },
                        amount: '7120787',
                    },
                    {
                        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
                        addressParameters: {
                            addressType: CardanoAddressType.BASE,
                            path: "m/1852'/1815'/0'/0/0",
                            stakingKeyHash:
                                '32c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dc',
                        },
                        amount: '7120787',
                    },
                    {
                        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
                        addressParameters: {
                            addressType: CardanoAddressType.POINTER,
                            path: "m/1852'/1815'/0'/0/0",
                            certificatePointer: {
                                blockIndex: 1,
                                txIndex: 2,
                                certificateIndex: 3,
                            },
                        },
                        amount: '7120787',
                    },
                    {
                        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
                        addressParameters: {
                            addressType: CardanoAddressType.ENTERPRISE,
                            path: "m/1852'/1815'/0'/0/0",
                        },
                        amount: '7120787',
                    },
                    {
                        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
                        addressParameters: {
                            addressType: CardanoAddressType.BYRON,
                            path: "m/44'/1815'/0'/0/1",
                        },
                        amount: '1000000',
                    },
                    {
                        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
                        address:
                            'addr1q84sh2j72ux0l03fxndjnhctdg7hcppsaejafsa84vh7lwgmcs5wgus8qt4atk45lvt4xfxpjtwfhdmvchdf2m3u3hlsd5tq5r',
                        amount: '1234',
                        tokenBundle: [
                            {
                                policyId:
                                    '95a292ffee938be03e9bae5657982a74e9014eb4960108c9e23a5b39',
                                tokenAmounts: [
                                    {
                                        assetNameBytes: '74652474436f696e',
                                        amount: '7878754',
                                    },
                                    {
                                        assetNameBytes: '84652474436f696e',
                                        amount: '12321',
                                    },
                                ],
                            },
                            {
                                policyId:
                                    'a5a292ffee938be03e9bae5657982a74e9014eb4960108c9e23a5b39',
                                tokenAmounts: [
                                    {
                                        assetNameBytes: '74652474436f696e',
                                        amount: '7878754',
                                    },
                                ],
                            },
                        ],
                    },
                ],
                fee: FEE,
                ttl: TTL,
                certificates: [
                    SAMPLE_CERTIFICATES.stake_registration,
                    SAMPLE_CERTIFICATES.stake_delegation,
                    SAMPLE_CERTIFICATES.stake_deregistration,
                ],
                withdrawals: [SAMPLE_WITHDRAWALS.basic],
                auxiliaryData: {
                    cVoteRegistrationParameters: {
                        stakingPath: "m/1852'/1815'/0'/2/0",
                        paymentAddressParameters: {
                            addressType: CardanoAddressType.BASE,
                            path: "m/1852'/1815'/0'/0/0",
                            stakingPath: "m/1852'/1815'/0'/2/0",
                        },
                        nonce: '22634813',
                        format: CardanoCVoteRegistrationFormat.CIP36,
                        delegations: [
                            {
                                votePublicKey:
                                    '1af8fa0b754ff99253d983894e63a2b09cbb56c833ba18c3384210163f63dcfc',
                                weight: 1,
                            },
                        ],
                        votingPurpose: 0,
                    },
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: 'f98e1b5edfd376356eb211103bfae679380929bf7fbc40b3355a68e98111d091',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '448d2e063f1dbc8662a9f6dea887549cbee7d8e4254124dd1aed08330f4ce165531a846b4ebc42e9944d85b99e878b4255860b960c5f4bd94d4feeb42295d402',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: '36a8ef21d5b98fdf23a27325cf643deaac35e912c835e35037f23d1061ae5b16',
                        signature:
                            '5ba01fe1a043d3851236395a22982bfdf9d58d80ee963c042e2aa3bc0f8b35b99be18319710ade92edcf49b7185b5e8d91710f3acaa8d9e0f41bad1e3271a801',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'e90d7b0a6cf831b0042d37961dd528842860e77914e715bcece676c75353b812',
                        signature:
                            '5595ab117629c0a3743e7081b315d937451d546525db43b7253a76662a24100d23baeaf232dc2cccfbdd624ec3439a20a3ca0914b71df0a766ba08f444d1a60d',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'bc65be1b0b9d7531778a1317c2aa6de936963c3f9ac7d5ee9e9eda25e0c97c5e',
                        signature:
                            'a130822ccf92dee7a9c357432c7e4b4c6f21fc6efac9c548d00162569bc748b19384ccdf6c132d68b04526658c3766e40cef7b45f73f5398b0db946469343005',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: {
                    type: 1,
                    auxiliaryDataHash:
                        '544c9ae849c82e31224865ff936decc6160047409eee4a6b4178b729fe3d286c',
                    cVoteRegistrationSignature:
                        '3064949c9f186138f95e228075d0119dd5cb50e1b7e75d24d569fa547e018a597615da7c79a39ca8e394ee1ba8acb83e70be80f37e69aef3b86e7c4a6bd44903',
                },
            },
            legacyResults: [legacyResults.beforeCIP36Registration],
        },

        {
            description: 'signWithIncludeNetworkId',
            params: {
                inputs: [SAMPLE_INPUTS.byron_input],
                outputs: [SAMPLE_OUTPUTS.simple_byron_output],
                fee: FEE,
                ttl: TTL,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
                includeNetworkId: true,
            },
            result: {
                hash: '4fcd4532bb0a9dfff2368e60be80d46819a92a9acfb2c64a7bf5975040789bac',
                witnesses: [
                    {
                        type: 0,
                        pubKey: '89053545a6c254b0d9b1464e48d2b5fcf91d4e25c128afb1fcfc61d0843338ea',
                        signature:
                            '7223909207fc1fa0c6125ffd4fbf7e1d845b7ca77078de7705aa34e4b6f416bb2efaaadfa022a91437ba4f33875b9a688f78d6fb30542b59417650a169afde01',
                        chainCode:
                            '26308151516f3b0e02bb1638142747863c520273ce9bd3e5cd91e1d46fe2a635',
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [
                {
                    // older FW doesn't support network id in tx body
                    rules: ['<2.4.4', '1'],
                    payload: false,
                },
            ],
        },

        {
            description: 'plutusWithDeviceOwnedOutput',
            params: {
                inputs: [SAMPLE_INPUTS.external_input],
                outputs: [
                    SAMPLE_OUTPUTS.simple_shelley_output,
                    SAMPLE_OUTPUTS.base_address_change_output,
                ],
                fee: FEE,
                ttl: TTL,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.PLUTUS_TRANSACTION,
                scriptDataHash: SCRIPT_DATA_HASH,
                collateralInputs: [SAMPLE_INPUTS.shelley_input],
            },
            result: {
                hash: 'b201b4b2d889f931020fe0f3f637cd3fbe79fae460ab24fd61182e48e9bc975a',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            'd84707a76565c5f748679cd3a46b93ba0c1aec37e49d8e87fbb6785738c19bd10b311af9eddc22e520b43ef0a4a6e934be7917ff87456522a6378d84e431d207',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforePlutus],
        },

        {
            description: 'plutusTransactionWithTokenMinting',
            params: {
                inputs: [SAMPLE_INPUTS.external_input],
                outputs: [SAMPLE_OUTPUTS.token_output],
                fee: FEE,
                ttl: TTL,
                validityIntervalStart: VALIDITY_INTERVAL_START,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.PLUTUS_TRANSACTION,
                mint: SAMPLE_MINTS.basic,
                scriptDataHash: SCRIPT_DATA_HASH,
                collateralInputs: [SAMPLE_INPUTS.shelley_input],
                additionalWitnessRequests: ["m/1854'/1815'/0'/0/0", "m/1855'/1815'/0'"],
            },
            result: {
                hash: '0bccf5125597d7459b3e19c807c0264b8e49864608ae271e3f37d602e28b5a5a',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '064c4876b3ddc6da4bc869f69b1a4408792469a7ba0f2646b7399f999bd76e2cb4d8da82e21b9b164ba56e14e5d8b78f3360ee52a29ca97ec4151368fbeb9f0d',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'b10be5c0d11ad8292bbe69e220ca0cfbe154610b3041a8e72f9d515c226ab3b1',
                        signature:
                            'c31e0e311c9dd3cac3cfd3214c1cf8fb02537df8b56afde06c57e7d56029eef2aee18a4422a22e64894fad48aaf745c7b019dd42fe562575986a93ec25a6250f',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'b75258e4f61eb7b313d8554c2fe10673cf214ca2d762bfd53ec3b7846e2ee872',
                        signature:
                            'd1f1727457d4905ad15b5f40756fd137647f09f7cafa36fd5de285193cf527dc36b4e403b64fd34ba0b9cad4f4a6a4906425d3d5f7fd07697ec3899598300e0a',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforePlutus],
        },

        {
            description: 'plutusWithStakeRegistration',
            params: {
                inputs: [SAMPLE_INPUTS.external_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                certificates: [SAMPLE_CERTIFICATES.stake_registration_script],
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.PLUTUS_TRANSACTION,
                scriptDataHash: SCRIPT_DATA_HASH,
                collateralInputs: [SAMPLE_INPUTS.shelley_input],
                additionalWitnessRequests: ["m/1854'/1815'/0'/0/0"],
            },
            result: {
                hash: 'bb3641fac12c97ff6282030cc329865c9358891d75a4f4994592cbda3c17ad3d',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '929c5cf0ab54d17223391d635a984c52e0d208273ec2b1681dbbb5c5945b8a6f423caaa7b916beb2337e381bfb7a365abe71a218c84bd9c959b8c6a77608d201',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'b10be5c0d11ad8292bbe69e220ca0cfbe154610b3041a8e72f9d515c226ab3b1',
                        signature:
                            '1ed19c09e302c3f09b9209d25bdf4df067401db1fb2c4fd99a7d0a605092be854cab36ebcdd5ba72e5c42114f99621a3e521cc6a2327fd0c1eb735e73175a201',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforePlutus],
        },

        {
            description: 'plutusWithStakeRegistrationAndStakeDelegation',
            params: {
                inputs: [SAMPLE_INPUTS.external_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                certificates: [
                    SAMPLE_CERTIFICATES.stake_registration_script,
                    SAMPLE_CERTIFICATES.stake_delegation_script,
                ],
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.PLUTUS_TRANSACTION,
                scriptDataHash: SCRIPT_DATA_HASH,
                collateralInputs: [SAMPLE_INPUTS.shelley_input],
                additionalWitnessRequests: ["m/1854'/1815'/0'/0/0", "m/1854'/1815'/0'/2/0"],
            },
            result: {
                hash: '1508afe08c30bc41574f311752e62f6dea1e65970bc29efb33e296e7f160b433',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '438787bb03133652ae21d7e96c9affc87f8c567d57d487e8bb2a9a6ab46ec5d58d6fc83ea60c5be1d80a1b1daba049a8a9c911e53832d5ee94b897ed6b6d7305',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'b10be5c0d11ad8292bbe69e220ca0cfbe154610b3041a8e72f9d515c226ab3b1',
                        signature:
                            '728c37c2053a87ecede6c660cb50b2863bc50a9c7a63593f2b7e07a1e8b0787150cf48a8b836c83586b470b43bcad65f68522478b0a8aad94f6f124244cf4b07',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'f2ef4ecd21ad28a8d270ca7be7e96c87f60dc821e13c0d0c5870344e9693637c',
                        signature:
                            'd570d163a74a9703a991ee74e7e50a67e1cd01290d879452a3ee1cb046a5a4711a1e89e90748f3bb11086d35b7f6343040886fcd3003fb1e8930258b6d06b60f',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforePlutus],
        },

        {
            description: 'plutusWithStakeDeregistration',
            params: {
                inputs: [SAMPLE_INPUTS.external_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                certificates: [SAMPLE_CERTIFICATES.stake_deregistration_script],
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.PLUTUS_TRANSACTION,
                scriptDataHash: SCRIPT_DATA_HASH,
                collateralInputs: [SAMPLE_INPUTS.shelley_input],
                additionalWitnessRequests: ["m/1854'/1815'/0'/0/0", "m/1854'/1815'/0'/2/0"],
            },
            result: {
                hash: '077c9e912f66f69d78c939c8368b164a9734b05ce95a859ee95dbeea48819f45',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '4552cbea3af1224153a15ff0b99fd03a51f3cbd626205ad278e97b7e162428a6907ef68d2e4ca4740c6554f3b8df2e2035a72fd2652739bc713c163497c5760b',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'b10be5c0d11ad8292bbe69e220ca0cfbe154610b3041a8e72f9d515c226ab3b1',
                        signature:
                            '0c140e1f59b2c0a9f0573ddb51357387de9388c7acd920ffd99efe39cab21b90afeaf3ed576ab11d2350f94fe731c70e8b7a57a328ec0722720fa854e6acce0f',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'f2ef4ecd21ad28a8d270ca7be7e96c87f60dc821e13c0d0c5870344e9693637c',
                        signature:
                            '35bc8f64f4a9d5200a5e363e7ec500ed718c5264c2d7aa51426c5cc19ba74259fe89a2c26f9120f3dd9fccb41a33efdede38d15bf02818866d663533efdc150b',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforePlutus],
        },

        {
            description: 'plutusWithStakeDeregistrationAndWithdrawal',
            params: {
                inputs: [SAMPLE_INPUTS.external_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                certificates: [SAMPLE_CERTIFICATES.stake_deregistration_script],
                withdrawals: [SAMPLE_WITHDRAWALS.script],
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.PLUTUS_TRANSACTION,
                scriptDataHash: SCRIPT_DATA_HASH,
                collateralInputs: [SAMPLE_INPUTS.shelley_input],
                additionalWitnessRequests: ["m/1854'/1815'/0'/0/0", "m/1854'/1815'/0'/2/0"],
            },
            result: {
                hash: '978a642582aa183a26768e3d22ff964cb8c8db1fb94abb571355ad7bfc8d3020',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '6d04fcde8a22e2170d9639b4422737d784b7f11496374d8466a233b635274c84848697c891a5c687d35e304b57cf80af62d4f80badc2b62e07484583ed313c0c',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'b10be5c0d11ad8292bbe69e220ca0cfbe154610b3041a8e72f9d515c226ab3b1',
                        signature:
                            '9d16583fbb3bacbba6fa23e22133d449235cf56b5262a40df158b92311ee3319427496f0a0740382c9915ea41387ef71e6b6a9e0c1d836b478bfbca3d27e4b0f',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'f2ef4ecd21ad28a8d270ca7be7e96c87f60dc821e13c0d0c5870344e9693637c',
                        signature:
                            'eb97a4bdde77feb6116bbfbd2dce81419e0fae77bb54ed6ed7ad3b23de054eb3ada57d35ec73307f761c807ddb87d88e3bd434f164d524b76174916665af2406',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforePlutus],
        },

        {
            description: 'plutusWithPathStakeCredentials',
            params: {
                inputs: [SAMPLE_INPUTS.external_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                certificates: [SAMPLE_CERTIFICATES.stake_deregistration],
                withdrawals: [SAMPLE_WITHDRAWALS.basic],
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.PLUTUS_TRANSACTION,
                scriptDataHash: SCRIPT_DATA_HASH,
                collateralInputs: [SAMPLE_INPUTS.shelley_input],
                additionalWitnessRequests: ["m/1854'/1815'/0'/0/0", "m/1854'/1815'/0'/2/0"],
            },
            result: {
                hash: '782d27250d487d1feec96a44aeda4e796f3f97cbeedc9eaf0f4cd2ec6f399106',
                witnesses: [
                    {
                        type: 1,
                        pubKey: 'bc65be1b0b9d7531778a1317c2aa6de936963c3f9ac7d5ee9e9eda25e0c97c5e',
                        signature:
                            '03a62ab84cbc9f3f1819b7fd68f2bfeca545a97967d824644f3362488763d8d88597cf19661e4c200eccf9a1e747666916099b604e849ae94a286dc935de8a0d',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            'b00848c888bdad1036335bf3f085af00080e448a223187475c6e898aa2a0a6587a28234ac6c7c918847ea00e497b515854ce86471d5860e014d4336fa171fd0d',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'b10be5c0d11ad8292bbe69e220ca0cfbe154610b3041a8e72f9d515c226ab3b1',
                        signature:
                            '8abf56dadd52259a404563eda52a39631875e36cadd2050829cf755906c5dba91a99834ef3c0e6e507fdc36ed7e8c4880fb8d8834a48dc2315d7201dd6308c00',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'f2ef4ecd21ad28a8d270ca7be7e96c87f60dc821e13c0d0c5870344e9693637c',
                        signature:
                            '0b045abaa864a00badd747bdcbc67870336cd94b83f58a5d84cfbfac9e9ba53f8e18175eb630928696072831d9697c1fa33b745a12d6dde2cc6722dd0bed3409',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforePlutus],
        },

        {
            description: 'plutusWithKeyHashStakeCredentials',
            params: {
                inputs: [SAMPLE_INPUTS.external_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                certificates: [SAMPLE_CERTIFICATES.stake_deregistration_key_hash],
                withdrawals: [SAMPLE_WITHDRAWALS.key_hash],
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.PLUTUS_TRANSACTION,
                scriptDataHash: SCRIPT_DATA_HASH,
                collateralInputs: [SAMPLE_INPUTS.shelley_input],
                additionalWitnessRequests: ["m/1854'/1815'/0'/0/0", "m/1854'/1815'/0'/2/0"],
            },
            result: {
                hash: 'fdcfc5a84caaf8b4ee5efbafb0bc0118eb4e0fec88312429de60ebf34f60e44f',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '9a69dbfb8b61ae7269f3d17c7821b670697382a77584a2fde58bb5cd5b15e8cd08c04a9baaa416b45498649961f1362641e5d2e01dee6f949ac5809ecb0ede02',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'b10be5c0d11ad8292bbe69e220ca0cfbe154610b3041a8e72f9d515c226ab3b1',
                        signature:
                            '79a4671f3703f6fe1d67768eed906cf1fdd230655be54360d5e512dd040f5f27022cff99d0ddb073ac58c72d1aecdccc3dff29d49b274214367475767fdd1c0e',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'f2ef4ecd21ad28a8d270ca7be7e96c87f60dc821e13c0d0c5870344e9693637c',
                        signature:
                            'c8fc1809c122e6040e564b9226fcdf215075ffa418fc21c74fd04a8d804a989fc005963f1803fcb2fc1b017ff20c5d1bc0fe7a8d20b284210ed89405f5269c02',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforePlutus],
        },

        {
            description: 'plutusWithRequiredSigners',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.PLUTUS_TRANSACTION,
                scriptDataHash: SCRIPT_DATA_HASH,
                collateralInputs: [SAMPLE_INPUTS.shelley_input_2],
                requiredSigners: [
                    { keyPath: "m/1852'/1815'/0'/0/0" },
                    { keyPath: "m/1854'/1815'/0'/0/0" },
                    { keyHash: '3a7f09d3df4cf66a7399c2b05bfa234d5a29560c311fc5db4c490711' },
                ],
            },
            result: {
                hash: 'a95ab5e64e225cef28ba889580ca55ec2d95c7154e3f970015f725c0489ba8f6',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            'd6463e5436b97d06cffe8785fe2da73325b749279c10f56b69c1b1d66a2825ff9c943a57efdce35cf8e0172512635b3cde4d0058f376406f07000c13c4d4c600',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: '36a8ef21d5b98fdf23a27325cf643deaac35e912c835e35037f23d1061ae5b16',
                        signature:
                            '77d3a31d8ab3636eff7f6a92124635d6049b9e62adc83aca06afe1613159151361b4334a56e05385f83dd42cf43ab375cb96a31afa3c0085c07a48f61b41a400',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'b10be5c0d11ad8292bbe69e220ca0cfbe154610b3041a8e72f9d515c226ab3b1',
                        signature:
                            '0edd219618307ebf9be9618d35136f38efcefdc242ca3d42324c88199cdadb1e773bf76f0f731746ffc7b14a9ae92e692ab6a3886f19f7b28f148c2a08825e06',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforePlutus],
        },

        {
            description: 'plutusWithManyWitnesses',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                certificates: [SAMPLE_CERTIFICATES.stake_deregistration_script],
                withdrawals: [SAMPLE_WITHDRAWALS.script],
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.PLUTUS_TRANSACTION,
                scriptDataHash: SCRIPT_DATA_HASH,
                collateralInputs: [SAMPLE_INPUTS.shelley_input_2],
                requiredSigners: [
                    { keyPath: "m/1852'/1815'/0'/0/2" },
                    { keyPath: "m/1854'/1815'/0'/0/2" },
                    { keyPath: "m/1855'/1815'/0'" },
                ],
                additionalWitnessRequests: ["m/1852'/1815'/0'/0/3", "m/1854'/1815'/0'/0/3"],
            },
            result: {
                hash: '37face132b208b869d0c11fcab487648067e6978df37b5347bde2964902cc9da',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '21bb9cd8950b7fcb87a18fd061cc022e58de5f01f24d85c88148b84c4ce98cf646754a86c5bb70eae156a3b9e6676c9d817e2adcf47dd538dc54042a1fe2fc07',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: '36a8ef21d5b98fdf23a27325cf643deaac35e912c835e35037f23d1061ae5b16',
                        signature:
                            '7075c37f7ea5c2def45249792c36b97a787e9fe99bd85f0629d31e81a42e3c07754b231b197c53e4a86219782c356eb5efc8792319da25206e8ce151da01880c',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'e90d7b0a6cf831b0042d37961dd528842860e77914e715bcece676c75353b812',
                        signature:
                            '8725de956178b26539901d0f74a5094d7eacd482e3f7c62a48aac782ee89f25071f2ab9852ea876bdde3501e82e9978bc22ba672b16c25e65d2413ff6f74c00a',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'e03c8b809288457c44e6dac9bc03d7c91cc0b26b482ae370f6b58da7c1fa90ec',
                        signature:
                            'cfc5fc39fd2cacf0ed8ce628a3ef4976f36be33b35357b1cae91752490fc222615f936af858caeefa48b27be949f49c1e165510854f41bc44c6ee447647e3e0b',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'b75258e4f61eb7b313d8554c2fe10673cf214ca2d762bfd53ec3b7846e2ee872',
                        signature:
                            '0a2934ab1262f829e63d83111db991d71a067e854dbbecd490c2f94331699213fb5b6da317eb9b9a20b6de20c3dc2512547603ba6838c872281604285a830101',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: '10ae189d1d30bef9214e006a0287fc5f2caf56576f04c9d3ef381f0f67856166',
                        signature:
                            '446ee208d7b5ac79509f1b6218c34929e382932cbb4d7278241fcf66fee2417d72bccc76d265828a525017aba9ee1ef08708a3a51162907023969eefa9ebee04',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: '6ca4df772965773f096792f45f5241e01aa065ccb6ac12091483e418a04721e9',
                        signature:
                            '2f5c120e60211d14cd47a405f79e59cae591bb83599972b62c0027c2864794cc1d2b3d5659f5e56c76f39b71f113f3b1ede12390f2fccc143c52d37606d02803',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforePlutus],
        },

        {
            description: 'ordinaryTransactionWithOutputDatumHashAndBaseAddressParameters',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.output_with_datum_hash_and_base_address_paramaters],
                fee: FEE,
                ttl: TTL,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: 'b90ad6dd0e1155559bd3e66f2fce91f4c85598d47c90922f01e121ea4f51f96e',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            'bce7857e140ad2edefdc2c162fe3bfadd7693337da49d0231e04ab23f837afd9a041a807ed3fb2d76fb67377d89b5af0f627cb0109a7983b4663bf8b3e8a250e',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeBabbage],
        },

        {
            description: 'ordinaryTransactionWithRequiredSigner',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
                requiredSigners: [{ keyPath: "m/1852'/1815'/0'/0/1" }],
            },
            result: {
                hash: '8c328640f974f47cecbcaed56e46c3ba4f2ea6769e6e3528915deb3bb518aa06',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '795cde3de6c43c4cd8030d80b5eb29c8bf60c6d90a641aa86b6590fce97e920261f947a7783193faad2ad26bf8e8f1f2c2eab3ee4a56f105c0acd97b0a779d00',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: '36a8ef21d5b98fdf23a27325cf643deaac35e912c835e35037f23d1061ae5b16',
                        signature:
                            '53635fa332a154b8d345279e47d264c55533a897490016da76542fb960434afe99a759580b273e89233c45c7a2a193d7fae2e3b1181fcfba24988a045f7aea03',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeBabbage],
        },

        {
            description: 'multisigTransactionWithRequiredSigner',
            params: {
                inputs: [SAMPLE_INPUTS.external_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.MULTISIG_TRANSACTION,
                requiredSigners: [{ keyPath: "m/1854'/1815'/0'/0/1" }],
                additionalWitnessRequests: ["m/1854'/1815'/0'/0/2"],
            },
            result: {
                hash: '2cb5fd3a027578e5c0d06853690fb91b9403b6feda9032b1bf8df83bbad15465',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '021a000e3be05eb09051983cbf728322149cc5687a79f0a1dbccd25b3a754c59',
                        signature:
                            '7c69ad3122964c8f37f0a0a364ad187cc28b424ddca5c14429fc97461d416fa270c9cbd65a26b83149220f61c87b40c252638640c2b02f9a82489f12fe98be04',
                        chainCode: null,
                    },
                    {
                        type: 1,
                        pubKey: 'e03c8b809288457c44e6dac9bc03d7c91cc0b26b482ae370f6b58da7c1fa90ec',
                        signature:
                            '47685f84c364f2db7a7249119f159375adf539b721dcdee3959fb83389209166c433c22384fa3ef52f690f63c40904efbcce0d86fda1e826e4fe063a0255e503',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeBabbage],
        },

        {
            description: 'ordinaryTransactionWithBothOutputFormats',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [
                    {
                        format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
                        address: 'addr1w9rhu54nz94k9l5v6d9rzfs47h7dv7xffcwkekuxcx3evnqpvuxu0',
                        amount: '1',
                        tokenBundle: [
                            {
                                policyId:
                                    '95a292ffee938be03e9bae5657982a74e9014eb4960108c9e23a5b39',
                                tokenAmounts: [
                                    {
                                        assetNameBytes: '74652474436f696e',
                                        amount: '7878754',
                                    },
                                ],
                            },
                        ],
                        datumHash:
                            '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
                    },
                    {
                        format: CardanoTxOutputSerializationFormat.MAP_BABBAGE,
                        address: 'addr1w9rhu54nz94k9l5v6d9rzfs47h7dv7xffcwkekuxcx3evnqpvuxu0',
                        amount: '1',
                        tokenBundle: [
                            {
                                policyId:
                                    '95a292ffee938be03e9bae5657982a74e9014eb4960108c9e23a5b39',
                                tokenAmounts: [
                                    {
                                        assetNameBytes: '74652474436f696e',
                                        amount: '7878754',
                                    },
                                ],
                            },
                        ],
                        datumHash:
                            '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
                    },
                ],
                fee: FEE,
                ttl: TTL,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: 'b664d33bfcbfc1b54f34c813438ab4dac788ce715a3461f85142c4d19460e949',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            'e9ecd38c4c8219eca08971a6949971f3afb33e64f727e9958bfc51b42b913f445adec954d938b9bad0759740979d45f5e97da1581d1d588ff0acfbf53232e90e',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeBabbage],
        },

        {
            description: 'ordinaryTransactionWithBabbageOutput',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.output_with_babbage_data],
                fee: FEE,
                ttl: TTL,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: '719d33e1e2811f82046951dccee1a9af82d8fe1d8abc36d581a9eccc421c3204',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '57831ef649d0fd3fcda9ec218d071889dfd9296643a908101ae4a8030d053df4141b201dea9866ff63533547274db060abe7513989ab1299852b94db6236b20e',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeBabbage],
        },

        {
            description: 'ordinaryTransactionWithLongBabbageOutput',
            params: {
                inputs: [SAMPLE_INPUTS.shelley_input],
                outputs: [SAMPLE_OUTPUTS.output_with_long_babbage_data_and_change_address],
                fee: FEE,
                ttl: TTL,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            result: {
                hash: '821e8163c5cf225c09f338f385c81e4326610f830e2abb89f9961e20741e6b70',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '563c135e4a7eddbdcdf2e34f4f18b6e6d813d150a81cdeed2290fdc4b4884e2af0a849d7191713f4a26b15ebe35cb362b6d289b4030f79128070d5a5733c8909',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeBabbage],
        },

        {
            description: 'plutusWithBabbageElementsAndSharedWithLedger',
            params: {
                inputs: [SAMPLE_INPUTS.plutus_input],
                outputs: [
                    SAMPLE_OUTPUTS.output_common_with_ledger,
                    SAMPLE_OUTPUTS.babbage_output_common_with_ledger,
                ],
                fee: FEE,
                ttl: TTL,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.PLUTUS_TRANSACTION,
                scriptDataHash: SCRIPT_DATA_HASH,
                collateralInputs: [SAMPLE_INPUTS.plutus_input],
                collateralReturn: {
                    format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
                    address:
                        'addr1q84sh2j72ux0l03fxndjnhctdg7hcppsaejafsa84vh7lwgmcs5wgus8qt4atk45lvt4xfxpjtwfhdmvchdf2m3u3hlsd5tq5r',
                    amount: '2000000',
                    tokenBundle: [
                        {
                            policyId: '95a292ffee938be03e9bae5657982a74e9014eb4960108c9e23a5b39',
                            tokenAmounts: [
                                {
                                    assetNameBytes: '74652474436f696e',
                                    amount: '7878754',
                                },
                            ],
                        },
                    ],
                },
                totalCollateral: TOTAL_COLLATERAL,
                referenceInput: [SAMPLE_INPUTS.plutus_input],
            },
            result: {
                hash: '699d3267d8c59cfcb838385cd2fee864e9c2043b7b85d80e6626d88c1966dd71',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '0ea26710d9fc8a321163139de2641241df4e54137641809b090b75b2d54a9aa868ff9c6e25d596498a17d6d75fc99bf3c45bebad520982075a5c12c836cdbb0d',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeBabbage],
        },

        {
            description: 'plutusWithDeviceOwnedCollateralReturn',
            params: {
                inputs: [SAMPLE_INPUTS.plutus_input],
                outputs: [SAMPLE_OUTPUTS.simple_shelley_output],
                fee: FEE,
                ttl: TTL,
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
                signingMode: CardanoTxSigningMode.PLUTUS_TRANSACTION,
                scriptDataHash: SCRIPT_DATA_HASH,
                collateralInputs: [SAMPLE_INPUTS.plutus_input],
                collateralReturn: {
                    format: CardanoTxOutputSerializationFormat.ARRAY_LEGACY,
                    addressParameters: {
                        addressType: CardanoAddressType.BASE,
                        path: "m/1852'/1815'/0'/0/0",
                        stakingPath: "m/1852'/1815'/0'/2/0",
                    },
                    amount: '2000000',
                    tokenBundle: [
                        {
                            policyId: '95a292ffee938be03e9bae5657982a74e9014eb4960108c9e23a5b39',
                            tokenAmounts: [
                                {
                                    assetNameBytes: '74652474436f696e',
                                    amount: '7878754',
                                },
                            ],
                        },
                    ],
                },
            },
            result: {
                hash: 'c95a6f99f5763d89926b44b8a0f7fa12f14ee3978c120e42c581a3f47638d490',
                witnesses: [
                    {
                        type: 1,
                        pubKey: '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1',
                        signature:
                            '495b8941fac6fd3f61de87c592f65f06bd4c8499a683a396382c3da89faca348d8559d3775bb5046be6213f4623a917fc3412b26065f943731769df3452d6308',
                        chainCode: null,
                    },
                ],
                auxiliaryDataSupplement: undefined,
            },
            legacyResults: [legacyResults.beforeBabbage],
        },
    ],
};
