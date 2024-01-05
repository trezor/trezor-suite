import { NETWORK_IDS, PROTOCOL_MAGICS } from '../../src/constants/cardano';
import { CardanoAddressType } from '@trezor/protobuf/lib/messages-schema';

const legacyResults = [
    {
        // cardanoGetAddress not supported below this version
        rules: ['<2.3.2', '1'],
        success: false,
    },
];

export default {
    method: 'cardanoGetAddress',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: "Mainnet - m/44'/1815'/0'/0/0",
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.BYRON,
                    path: "m/44'/1815'/0'/0/0",
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
            },
            result: {
                address: 'Ae2tdPwUPEZ5YUb8sM3eS8JqKgrRLzhiu71crfuH2MFtqaYr5ACNRdsswsZ',
            },
            legacyResults,
        },
        {
            description: "Byron Mainnet - m/44'/1815'",
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.BYRON,
                    path: "m/44'/1815'",
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
            },
            result: false,
        },
        {
            description: "Byron Mainnet - m/44'/1815'/0'/0/1",
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.BYRON,
                    path: "m/44'/1815'/0'/0/1",
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
            },
            result: {
                address: 'Ae2tdPwUPEZJb8r1VZxweSwHDTYtqeYqF39rZmVbrNK62JHd4Wd7Ytsc8eG',
            },
            legacyResults,
        },
        {
            description: "Byron Mainnet- m/44'/1815'/0'/0/2",
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.BYRON,
                    path: "m/44'/1815'/0'/0/2",
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
            },
            result: {
                address: 'Ae2tdPwUPEZFm6Y7aPZGKMyMAK16yA5pWWKU9g73ncUQNZsAjzjhszenCsq',
            },
            legacyResults,
        },
        {
            description: "Byron Testnet - m/44'/1815'/0'/0/0",
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.BYRON,
                    path: "m/44'/1815'/0'/0/0",
                },
                protocolMagic: 42, // legacy testnet protocol magic
                networkId: NETWORK_IDS.testnet,
            },
            result: {
                address: '2657WMsDfac5F3zbgs9BwNWx3dhGAJERkAL93gPa68NJ2i8mbCHm2pLUHWSj8Mfea',
            },
            legacyResults,
        },
        {
            description: "Byron Testnet - m/44'/1815'/0'/0/1",
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.BYRON,
                    path: "m/44'/1815'/0'/0/1",
                },
                protocolMagic: 42, // legacy testnet protocol magic
                networkId: NETWORK_IDS.testnet,
            },
            result: {
                address: '2657WMsDfac6ezKWszxLFqJjSUgpg9NgxKc1koqi24sVpRaPhiwMaExk4useKn5HA',
            },
            legacyResults,
        },
        {
            description: "Byron Testnet - m/44'/1815'/0'/0/2",
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.BYRON,
                    path: "m/44'/1815'/0'/0/2",
                },
                protocolMagic: 42, // legacy testnet protocol magic
                networkId: NETWORK_IDS.testnet,
            },
            result: {
                address: '2657WMsDfac7hr1ioJGr6g7r6JRx4r1My8Rj91tcPTeVjJDpfBYKURrPG2zVLx2Sq',
            },
            legacyResults,
        },
        {
            description: "Base Mainnet - m/1852'/1815'/4'/0/0",
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.BASE,
                    path: "m/1852'/1815'/4'/0/0",
                    stakingPath: "m/1852'/1815'/4'/2/0",
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
            },
            result: {
                address:
                    'addr1q8v42wjda8r6mpfj40d36znlgfdcqp7jtj03ah8skh6u8wnrqua2vw243tmjfjt0h5wsru6appuz8c0pfd75ur7myyeqsx9990',
            },
            legacyResults,
        },
        {
            description: "Base Mainnet Paths as Numbers - m/1852'/1815'/4'/0/0",
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.BASE,
                    path: [0x80000000 + 1852, 0x80000000 + 1815, 0x80000000 + 4, 0, 0],
                    stakingPath: [0x80000000 + 1852, 0x80000000 + 1815, 0x80000000 + 4, 2, 0],
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
            },
            result: {
                address:
                    'addr1q8v42wjda8r6mpfj40d36znlgfdcqp7jtj03ah8skh6u8wnrqua2vw243tmjfjt0h5wsru6appuz8c0pfd75ur7myyeqsx9990',
            },
            legacyResults,
        },
        {
            description: "Base Testnet - m/1852'/1815'/4'/0/0",
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.BASE,
                    path: "m/1852'/1815'/4'/0/0",
                    stakingPath: "m/1852'/1815'/4'/2/0",
                },
                protocolMagic: PROTOCOL_MAGICS.testnet_preprod,
                networkId: NETWORK_IDS.testnet,
            },
            result: {
                address:
                    'addr_test1qrv42wjda8r6mpfj40d36znlgfdcqp7jtj03ah8skh6u8wnrqua2vw243tmjfjt0h5wsru6appuz8c0pfd75ur7myyeqnsc9fs',
            },
            legacyResults,
        },
        {
            description: "Base Staking Key Hash Mainnet - m/1852'/1815'/4'/0/0",
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.BASE,
                    path: "m/1852'/1815'/4'/0/0",
                    stakingKeyHash: '1bc428e4720702ebd5dab4fb175324c192dc9bb76cc5da956e3c8dff',
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
            },
            result: {
                address:
                    'addr1q8v42wjda8r6mpfj40d36znlgfdcqp7jtj03ah8skh6u8wsmcs5wgus8qt4atk45lvt4xfxpjtwfhdmvchdf2m3u3hlsydc62k',
            },
            legacyResults,
        },
        {
            description: "Base Staking Key Hash Testnet - m/1852'/1815'/4'/0/0",
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.BASE,
                    path: "m/1852'/1815'/4'/0/0",
                    stakingKeyHash: '1bc428e4720702ebd5dab4fb175324c192dc9bb76cc5da956e3c8dff',
                },
                protocolMagic: PROTOCOL_MAGICS.testnet_preprod,
                networkId: NETWORK_IDS.testnet,
            },
            result: {
                address:
                    'addr_test1qrv42wjda8r6mpfj40d36znlgfdcqp7jtj03ah8skh6u8wsmcs5wgus8qt4atk45lvt4xfxpjtwfhdmvchdf2m3u3hls8m96xf',
            },
            legacyResults,
        },
        {
            description: 'Base Script Key Mainnet',
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.BASE_SCRIPT_KEY,
                    paymentScriptHash: '0d5acbf6a1dfb0c8724e60df314987315ccbf78bb6c0f9b6f3d568fe',
                    stakingPath: "m/1852'/1815'/0'/2/0",
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
            },
            result: {
                address:
                    'addr1zyx44jlk580mpjrjfesd7v2fsuc4ejlh3wmvp7dk702k3lsj922xhxkn6twlq2wn4q50q352annk3903tj00h45mgfmsf42dkl',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: 'Base Script Key Testnet',
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.BASE_SCRIPT_KEY,
                    paymentScriptHash: '0d5acbf6a1dfb0c8724e60df314987315ccbf78bb6c0f9b6f3d568fe',
                    stakingPath: "m/1852'/1815'/0'/2/0",
                },
                protocolMagic: PROTOCOL_MAGICS.testnet_preprod,
                networkId: NETWORK_IDS.testnet,
            },
            result: {
                address:
                    'addr_test1zqx44jlk580mpjrjfesd7v2fsuc4ejlh3wmvp7dk702k3lsj922xhxkn6twlq2wn4q50q352annk3903tj00h45mgfms2rhd6q',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: 'Base Key Script Mainnet',
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.BASE_KEY_SCRIPT,
                    path: "m/1852'/1815'/0'/0/0",
                    stakingScriptHash: '8d7bebc7a58f1c7b5fb7c9391071ecd3b51b032695522f8c555343a9',
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
            },
            result: {
                address:
                    'addr1yxq0nckg3ekgzuqg7w5p9mvgnd9ym28qh5grlph8xd2z925d004u0fv0r3a4ld7f8yg8rmxnk5dsxf542ghcc42ngw5s8vnrtt',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: 'Base Key Script Testnet',
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.BASE_KEY_SCRIPT,
                    path: "m/1852'/1815'/0'/0/0",
                    stakingScriptHash: '8d7bebc7a58f1c7b5fb7c9391071ecd3b51b032695522f8c555343a9',
                },
                protocolMagic: PROTOCOL_MAGICS.testnet_preprod,
                networkId: NETWORK_IDS.testnet,
            },
            result: {
                address:
                    'addr_test1yzq0nckg3ekgzuqg7w5p9mvgnd9ym28qh5grlph8xd2z925d004u0fv0r3a4ld7f8yg8rmxnk5dsxf542ghcc42ngw5sy6wr85',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: 'Base Script Script Mainnet',
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.BASE_SCRIPT_SCRIPT,
                    paymentScriptHash: '0d5acbf6a1dfb0c8724e60df314987315ccbf78bb6c0f9b6f3d568fe',
                    stakingScriptHash: '8d7bebc7a58f1c7b5fb7c9391071ecd3b51b032695522f8c555343a9',
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
            },
            result: {
                address:
                    'addr1xyx44jlk580mpjrjfesd7v2fsuc4ejlh3wmvp7dk702k3l5d004u0fv0r3a4ld7f8yg8rmxnk5dsxf542ghcc42ngw5s3gftll',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: 'Base Script Script Testnet',
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.BASE_SCRIPT_SCRIPT,
                    paymentScriptHash: '0d5acbf6a1dfb0c8724e60df314987315ccbf78bb6c0f9b6f3d568fe',
                    stakingScriptHash: '8d7bebc7a58f1c7b5fb7c9391071ecd3b51b032695522f8c555343a9',
                },
                protocolMagic: PROTOCOL_MAGICS.testnet_preprod,
                networkId: NETWORK_IDS.testnet,
            },
            result: {
                address:
                    'addr_test1xqx44jlk580mpjrjfesd7v2fsuc4ejlh3wmvp7dk702k3l5d004u0fv0r3a4ld7f8yg8rmxnk5dsxf542ghcc42ngw5sj75tnq',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: "Enterprise Mainnet - m/1852'/1815'/0'/0/0",
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.ENTERPRISE,
                    path: "m/1852'/1815'/0'/0/0",
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
            },
            result: {
                address: 'addr1vxq0nckg3ekgzuqg7w5p9mvgnd9ym28qh5grlph8xd2z92su77c6m',
            },
            legacyResults,
        },
        {
            description: "Enterprise Testnet - m/1852'/1815'/0'/0/0",
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.ENTERPRISE,
                    path: "m/1852'/1815'/0'/0/0",
                },
                protocolMagic: PROTOCOL_MAGICS.testnet_preprod,
                networkId: NETWORK_IDS.testnet,
            },
            result: {
                address: 'addr_test1vzq0nckg3ekgzuqg7w5p9mvgnd9ym28qh5grlph8xd2z92s8k2y47',
            },
            legacyResults,
        },
        {
            description: 'Enterprise Script Mainnet',
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.ENTERPRISE_SCRIPT,
                    paymentScriptHash: '0d5acbf6a1dfb0c8724e60df314987315ccbf78bb6c0f9b6f3d568fe',
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
            },
            result: {
                address: 'addr1wyx44jlk580mpjrjfesd7v2fsuc4ejlh3wmvp7dk702k3lsqee7sp',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: 'Enterprise Script Testnet',
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.ENTERPRISE_SCRIPT,
                    paymentScriptHash: '0d5acbf6a1dfb0c8724e60df314987315ccbf78bb6c0f9b6f3d568fe',
                },
                protocolMagic: PROTOCOL_MAGICS.testnet_preprod,
                networkId: NETWORK_IDS.testnet,
            },
            result: {
                address: 'addr_test1wqx44jlk580mpjrjfesd7v2fsuc4ejlh3wmvp7dk702k3lsm3dzly',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: "Pointer Mainnet - m/1852'/1815'/0'/0/0",
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.POINTER,
                    path: "m/1852'/1815'/0'/0/0",
                    certificatePointer: {
                        blockIndex: 1,
                        txIndex: 2,
                        certificateIndex: 3,
                    },
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
            },
            result: {
                address: 'addr1gxq0nckg3ekgzuqg7w5p9mvgnd9ym28qh5grlph8xd2z92spqgpsl97q83',
            },
            legacyResults,
        },
        {
            description: "Pointer Testnet - m/1852'/1815'/0'/0/0",
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.POINTER,
                    path: "m/1852'/1815'/0'/0/0",
                    certificatePointer: {
                        blockIndex: 24157,
                        txIndex: 177,
                        certificateIndex: 42,
                    },
                },
                protocolMagic: PROTOCOL_MAGICS.testnet_preprod,
                networkId: NETWORK_IDS.testnet,
            },
            result: {
                address: 'addr_test1gzq0nckg3ekgzuqg7w5p9mvgnd9ym28qh5grlph8xd2z925ph3wczvf2ag2x9t',
            },
            legacyResults,
        },
        {
            description: 'Pointer Script Mainnet',
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.POINTER_SCRIPT,
                    paymentScriptHash: '0d5acbf6a1dfb0c8724e60df314987315ccbf78bb6c0f9b6f3d568fe',
                    certificatePointer: {
                        blockIndex: 24157,
                        txIndex: 177,
                        certificateIndex: 42,
                    },
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
            },
            result: {
                address: 'addr12yx44jlk580mpjrjfesd7v2fsuc4ejlh3wmvp7dk702k3l5ph3wczvf2zmd4yp',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: 'Pointer Script Testnet',
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.POINTER_SCRIPT,
                    paymentScriptHash: '0d5acbf6a1dfb0c8724e60df314987315ccbf78bb6c0f9b6f3d568fe',
                    certificatePointer: {
                        blockIndex: 24157,
                        txIndex: 177,
                        certificateIndex: 42,
                    },
                },
                protocolMagic: PROTOCOL_MAGICS.testnet_preprod,
                networkId: NETWORK_IDS.testnet,
            },
            result: {
                address: 'addr_test12qx44jlk580mpjrjfesd7v2fsuc4ejlh3wmvp7dk702k3l5ph3wczvf2d4sugn',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: "Reward Mainnet - m/1852'/1815'/0'/2/0",
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.REWARD,
                    stakingPath: "m/1852'/1815'/0'/2/0",
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
            },
            result: {
                address: 'stake1uyfz49rtntfa9h0s98f6s28sg69weemgjhc4e8hm66d5yacalmqha',
            },
            legacyResults,
        },
        {
            description: "Reward Testnet - m/1852'/1815'/0'/2/0",
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.REWARD,
                    stakingPath: "m/1852'/1815'/0'/2/0",
                },
                protocolMagic: PROTOCOL_MAGICS.testnet_preprod,
                networkId: NETWORK_IDS.testnet,
            },
            result: {
                address: 'stake_test1uqfz49rtntfa9h0s98f6s28sg69weemgjhc4e8hm66d5yac643znq',
            },
            legacyResults,
        },
        {
            description: 'Reward Script Mainnet',
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.REWARD_SCRIPT,
                    stakingScriptHash: '8d7bebc7a58f1c7b5fb7c9391071ecd3b51b032695522f8c555343a9',
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
            },
            result: {
                address: 'stake17xxhh6785k83c76lklynjyr3anfm2xcry624ytuv24f582gt5mad4',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: 'Reward Script Testnet',
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.REWARD_SCRIPT,
                    stakingScriptHash: '8d7bebc7a58f1c7b5fb7c9391071ecd3b51b032695522f8c555343a9',
                },
                protocolMagic: PROTOCOL_MAGICS.testnet_preprod,
                networkId: NETWORK_IDS.testnet,
            },
            result: {
                address: 'stake_test17zxhh6785k83c76lklynjyr3anfm2xcry624ytuv24f582gv73lfg',
            },
            legacyResults: [
                {
                    rules: ['<2.4.3', '1'],
                    payload: false,
                },
            ],
        },
        {
            description: 'Reward Mainnet - path sent as path instead of stakingPath',
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.REWARD,
                    path: "m/1852'/1815'/0'/2/0",
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
            },
            result: {
                address: 'stake1uyfz49rtntfa9h0s98f6s28sg69weemgjhc4e8hm66d5yacalmqha',
            },
            legacyResults,
        },
        {
            description: 'Reward Mainnet - both path and stakingPath are set',
            params: {
                addressParameters: {
                    addressType: CardanoAddressType.REWARD,
                    path: "m/1852'/1815'/0'/2/0",
                    stakingPath: "m/1852'/1815'/0'/2/0",
                },
                protocolMagic: PROTOCOL_MAGICS.mainnet,
                networkId: NETWORK_IDS.mainnet,
            },
            result: false,
        },
    ],
};
