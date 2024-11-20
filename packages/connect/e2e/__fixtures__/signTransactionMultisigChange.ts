const { TX_CACHE } = global.TestUtils;

const xpubExt1 =
    'tpubDADHV9u9Y6gkggintTdMjJE3be58zKNLhpxBQyuEM6Pwx3sN9JVLmMCMN4DNVwL9AKec27z5TaWcWuHzMXiGAtcra5DjwWbvppGX4gaEGVN';
const xpubExt2 =
    'tpubDADHV9u9Y6gkhWXBmDJ6TUhZajLWjvKukRe2w9FfhdbQpUux8Z8jnPHNAZqFRgHPg9sR7YR93xThM32M7NfRu8S5WyDtext7S62sqxeJNkd';
const xpubInt =
    'tpubDADHV9u9Y6gke2Vw3rWE8KRXmeK8PTtsF5B3Cqjo6h3SoiyRtzxjnDVG1knxrqB8BpP1dMAd6MR3Ps5UXibiFDtQuWVPXLkJ3HvttZYbH12';

const multisig1 = {
    pubkeys: [
        {
            node: xpubExt2,
            address_n: [0, 0],
        },
        {
            node: xpubExt1,
            address_n: [0, 0],
        },
        {
            node: xpubInt,
            address_n: [0, 0],
        },
    ],
    signatures: ['', '', ''],
    m: 2,
};
const multisig2 = {
    pubkeys: [
        {
            node: xpubExt1,
            address_n: [0, 1],
        },
        {
            node: xpubExt2,
            address_n: [0, 1],
        },
        {
            node: xpubInt,
            address_n: [0, 1],
        },
    ],
    signatures: ['', '', ''],
    m: 2,
};

const input1 = {
    address_n: [2147483693, 0, 0, 0],
    prev_hash: '16c6c8471b8db7a628f2b2bb86bfeefae1766463ce8692438c7fd3fce3f43ce5',
    prev_index: 1,
    amount: '50000000',
    script_type: 'SPENDMULTISIG',
    multisig: multisig1,
};
const input2 = {
    address_n: [2147483693, 0, 0, 1],
    prev_hash: 'd80c34ee14143a8bf61125102b7ef594118a3796cad670fa8ee15080ae155318',
    prev_index: 0,
    amount: '34500000',
    script_type: 'SPENDMULTISIG',
    multisig: multisig2,
};

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_12',
        settings: {
            safety_checks: 2,
        },
    },
    tests: [
        {
            description: 'Testnet (multisig): external external',
            params: {
                coin: 'Testnet',
                inputs: [input1, input2],
                outputs: [
                    {
                        address: 'muevUcG1Bb8eM2nGUGhqmeujHRX7YXjSEu',
                        amount: '40000000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: 'mwdrpMVSJxxsM8f8xbnCHn9ERaRT1NG1UX',
                        amount: '44000000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['16c6c8', 'd80c34']),
            },
            result: {
                serializedTx:
                    '0200000002e53cf4e3fcd37f8c439286ce636476e1faeebf86bbb2f228a6b78d1b47c8c61601000000b500483045022100fe26a8c16ceb31d0b17e8dbc507bc701f7f19121fc0b921d3983bb85e7c39d540220046b65ab73ccfba9e64da275f25505c14f568f35f5a2dad28a2c3865d5507e5b014c69522103dc07026aacb5918dac4e09f9da8290d0ae22161699636c22cace78082116a7792103e70db185fad69c2971f0107a42930e5d82a9ed3a11b922a96fdfc4124b63e54c2103f3fe007a1e34ac76c1a2528e9149f90f9f93739929797afab6a8e18d682fa71053aeffffffff185315ae8050e18efa70d6ca96378a1194f57e2b102511f68b3a1414ee340cd800000000b500483045022100af213b88d08558041c6f32545623cf54d79bc3351febdf3c992c758a196a032e02203b3d1990ad6cd167bcfcd95a974ce525fd7887e14d5a44db97825d629f635f2e014c6952210297ad8a5df42f9e362ef37d9a4ddced89d8f7a143690649aa0d0ff049c7daca842103ed1fd93989595d7ad4b488efd05a22c0239482c9a20923f2f214a38e54f6c41a2103f91460d79e4e463d7d90cb75254bcd62b515a99a950574c721efdc5f711dff3553aeffffffff02005a6202000000001976a9149b139230e4fe91c05a37ec334dc8378f3dbe377088ac00639f02000000001976a914b0d05a10926a7925508febdbab9a5bd4cda8c8f688ac00000000',
            },
        },
        {
            description: 'Testnet (multisig): external internal',
            params: {
                coin: 'Testnet',
                inputs: [input1, input2],
                outputs: [
                    {
                        address: 'muevUcG1Bb8eM2nGUGhqmeujHRX7YXjSEu',
                        amount: '40000000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: "m/45'/0/1/1",
                        amount: '44000000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['16c6c8', 'd80c34']),
            },
            result: {
                serializedTx:
                    '0200000002e53cf4e3fcd37f8c439286ce636476e1faeebf86bbb2f228a6b78d1b47c8c61601000000b500483045022100fe26a8c16ceb31d0b17e8dbc507bc701f7f19121fc0b921d3983bb85e7c39d540220046b65ab73ccfba9e64da275f25505c14f568f35f5a2dad28a2c3865d5507e5b014c69522103dc07026aacb5918dac4e09f9da8290d0ae22161699636c22cace78082116a7792103e70db185fad69c2971f0107a42930e5d82a9ed3a11b922a96fdfc4124b63e54c2103f3fe007a1e34ac76c1a2528e9149f90f9f93739929797afab6a8e18d682fa71053aeffffffff185315ae8050e18efa70d6ca96378a1194f57e2b102511f68b3a1414ee340cd800000000b500483045022100af213b88d08558041c6f32545623cf54d79bc3351febdf3c992c758a196a032e02203b3d1990ad6cd167bcfcd95a974ce525fd7887e14d5a44db97825d629f635f2e014c6952210297ad8a5df42f9e362ef37d9a4ddced89d8f7a143690649aa0d0ff049c7daca842103ed1fd93989595d7ad4b488efd05a22c0239482c9a20923f2f214a38e54f6c41a2103f91460d79e4e463d7d90cb75254bcd62b515a99a950574c721efdc5f711dff3553aeffffffff02005a6202000000001976a9149b139230e4fe91c05a37ec334dc8378f3dbe377088ac00639f02000000001976a914b0d05a10926a7925508febdbab9a5bd4cda8c8f688ac00000000',
            },
        },
        {
            description: 'Testnet (multisig): internal internal',
            params: {
                coin: 'Testnet',
                inputs: [input1, input2],
                outputs: [
                    {
                        address_n: "m/45'/0/1/0",
                        amount: '40000000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: "m/45'/0/1/1",
                        amount: '44000000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['16c6c8', 'd80c34']),
            },
            result: {
                serializedTx:
                    '0200000002e53cf4e3fcd37f8c439286ce636476e1faeebf86bbb2f228a6b78d1b47c8c61601000000b500483045022100fe26a8c16ceb31d0b17e8dbc507bc701f7f19121fc0b921d3983bb85e7c39d540220046b65ab73ccfba9e64da275f25505c14f568f35f5a2dad28a2c3865d5507e5b014c69522103dc07026aacb5918dac4e09f9da8290d0ae22161699636c22cace78082116a7792103e70db185fad69c2971f0107a42930e5d82a9ed3a11b922a96fdfc4124b63e54c2103f3fe007a1e34ac76c1a2528e9149f90f9f93739929797afab6a8e18d682fa71053aeffffffff185315ae8050e18efa70d6ca96378a1194f57e2b102511f68b3a1414ee340cd800000000b500483045022100af213b88d08558041c6f32545623cf54d79bc3351febdf3c992c758a196a032e02203b3d1990ad6cd167bcfcd95a974ce525fd7887e14d5a44db97825d629f635f2e014c6952210297ad8a5df42f9e362ef37d9a4ddced89d8f7a143690649aa0d0ff049c7daca842103ed1fd93989595d7ad4b488efd05a22c0239482c9a20923f2f214a38e54f6c41a2103f91460d79e4e463d7d90cb75254bcd62b515a99a950574c721efdc5f711dff3553aeffffffff02005a6202000000001976a9149b139230e4fe91c05a37ec334dc8378f3dbe377088ac00639f02000000001976a914b0d05a10926a7925508febdbab9a5bd4cda8c8f688ac00000000',
            },
        },
        {
            description: 'Testnet (multisig): external external',
            params: {
                coin: 'Testnet',
                inputs: [input1, input2],
                outputs: [
                    {
                        address: '2N2aFoogGntQFFwdUVPfRmutXD22ThcNTsR',
                        amount: '40000000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: '2NFJjQcU8mw4Z3ywpbek8HL1VoJ27GDrkHw',
                        amount: '44000000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['16c6c8', 'd80c34']),
            },
            result: {
                serializedTx:
                    '0200000002e53cf4e3fcd37f8c439286ce636476e1faeebf86bbb2f228a6b78d1b47c8c61601000000b40047304402205fe143e35e2fbba34aad93a0c6e4a0a022755a128d8ddeedff866a793d07ec3d022043c0c0c50d28d566ad52717c44671da4116c61cb628b54287d802efdbf1afd94014c69522103dc07026aacb5918dac4e09f9da8290d0ae22161699636c22cace78082116a7792103e70db185fad69c2971f0107a42930e5d82a9ed3a11b922a96fdfc4124b63e54c2103f3fe007a1e34ac76c1a2528e9149f90f9f93739929797afab6a8e18d682fa71053aeffffffff185315ae8050e18efa70d6ca96378a1194f57e2b102511f68b3a1414ee340cd800000000b500483045022100a7c8f5365dedbe28b071b1dcc919cd016ecf7b0161f5222676c82805c94a4547022043074900f85102067b386b8ec92659d02e96522bfd1f9899215211d7fb47e43e014c6952210297ad8a5df42f9e362ef37d9a4ddced89d8f7a143690649aa0d0ff049c7daca842103ed1fd93989595d7ad4b488efd05a22c0239482c9a20923f2f214a38e54f6c41a2103f91460d79e4e463d7d90cb75254bcd62b515a99a950574c721efdc5f711dff3553aeffffffff02005a62020000000017a91466528dd543f94d162c8111d2ec248d25ba9b90948700639f020000000017a914f1fc92c0aed1712911c70a2e09ac15ff0922652f8700000000',
            },
        },
    ],
};
