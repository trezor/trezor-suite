export const searchTransactionsFixture = [
    {
        description: 'Partial TXID search',
        search: 'ade',
        result: [
            '17b013822da84cc39a0d2df8abc78ade03c8712d078a2d614889fb189c52c8f5',
            '5986a3b46340a5999d70f86fee8caea6b9870500e602c30b630195ade281a833',
            'bf20f5eea272056d439eb78db97a207f5a1bd3e8a29ff920744f2eb70b8d9425', // Address contains search
            'dbe87d35c441d00cb2368b93a50ccd7ee8a984a838561a08b2cbc03b434338fb', // Address contains search
            '5f8dbb7c7b3ddf297cc21abb66adbadeaede30d14c49f12ec1d42117b3e8c159',
            '48ce7f7d6344b3cf0bf1f53356941d1df4cade3460fbd33800dcbdb635800d0e',
            '85a198193021b1298b1a227eae89194502dadef90612b095ff059a579ff88d6c',
        ],
    },
    {
        description: 'Exact TXID search',
        search: '93600f534749714165262774ab248a4a1c40e833238d9a4bbf539095213fa258',
        result: ['93600f534749714165262774ab248a4a1c40e833238d9a4bbf539095213fa258'],
    },
    {
        description: 'Partial Address search',
        search: 'b1qgu',
        result: [
            '8796794aaa4563098325ef2cb08cafd97112b1d31baeed97e4d39efba6249be4',
            '072d69d762f33ea5e4c4493e94ce4dcf927fe9d8cf6df5b8d40217336a05571e',
            'a59a1761ad3fad987258c79850e397398ab8559f157bc6868a7ed4e8b742ef01',
            'fbebc7273c3fdd61eef334687668c1152226d7361251460f0fb1c6ccacbbae78',
            'e81dcd9aaa60d855fb219e977a260dc621d9c24e00ffbe2e1cae8aed36f7802f',
            'ae0949b1b050ac6f92c7d9c1570f2f06c21a997eef8be9ef5edc2a38cb92a879',
            'c6d86cd9872e98cc8f4f79846d91699e35f04ce81fad9c088384a11a319ab4cb',
        ],
    },
    {
        description: 'Exact Address search',
        search: 'tb1qegw9kj8z3206neq9f09m9ahs67h4xq9tgvhjcj',
        result: [
            '93600f534749714165262774ab248a4a1c40e833238d9a4bbf539095213fa258',
            '8c40061886e9815498b59b564be390beb8b7ff73d436b1d1c833475974bc3e5a',
        ],
    },
    {
        description: 'Partial Output label search',
        search: 'Pota',
        result: [
            '62431e78bb13a4fdd9c87517db1ea70b4cb5763227327da35748c96497c6ea9a', // Potato
            '4f9af222a7c53ea708f8f370583608eda85c49f9f58901c82f0c79c6ab998b18', // Not Potato
        ],
    },
    {
        description: 'Exact Output label search',
        search: 'Not potato',
        result: [
            '4f9af222a7c53ea708f8f370583608eda85c49f9f58901c82f0c79c6ab998b18', // Not Potato
        ],
    },
    {
        description: 'Output label search (ignore casing)',
        search: 'pOtAtO',
        result: [
            '62431e78bb13a4fdd9c87517db1ea70b4cb5763227327da35748c96497c6ea9a', // Potato
            '4f9af222a7c53ea708f8f370583608eda85c49f9f58901c82f0c79c6ab998b18', // Not Potato
        ],
    },
    {
        description: 'Partial Address label search',
        search: 'AAA',
        result: [
            '9438960e985b1de4e118cbcedf6122c2467477d768d262863ee13e981b6c2816', // AAA
            '5be0cfd5b439c3112cfaea3cd05fdcea387433990885c86937d2488c59f1e692', // AAA
            'f38d1ae79872985688d92dcec6a359ca563c48a506e8766488ad1d2aa8e4ea30', // AAAFEFSF
            '905e181a3e3066a88bf848690ad32cd260ca53dc192d6f588c0344fa08363b11', // AAAFEFSF
            '65b768dacccfb209eebd95a1fb80a04f1dd6a3abc6d7b41d5e9d9f91605b37d9', // AAAFEFSF
            'e4b5b24159856ea18ab5819832da3b4a6330f9c3c0a46d96674e632df504b56b', // AAAFEFSF
            'b4fc775f2bace65b68ba8c43423fab2f96c8743c54d5468b92923f70ca20ae2e', // AAAFEFSF
            '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e', // AAAFEFSF
            'f405b50dff7053f3697f485f95fe1c0f6a4f5e52446281b4ef470c2762a15dae', // AAAFEFSF
            '575df1986c414f1d74bebc2229d794e423a2371fb51bac1d3b517e5cca51b5ea', // AAAFEFSF
            '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06', // AAAFEFSF
            'e294c4c172c3d87991b0369e45d6af8584be92914d01e3060fad1ed31d12ff00', // AAAFEFSF
        ],
    },
    {
        description: 'Exact Address label search',
        search: 'AAAFEFSF',
        result: [
            'f38d1ae79872985688d92dcec6a359ca563c48a506e8766488ad1d2aa8e4ea30', // AAAFEFSF
            '905e181a3e3066a88bf848690ad32cd260ca53dc192d6f588c0344fa08363b11', // AAAFEFSF
            '65b768dacccfb209eebd95a1fb80a04f1dd6a3abc6d7b41d5e9d9f91605b37d9', // AAAFEFSF
            'e4b5b24159856ea18ab5819832da3b4a6330f9c3c0a46d96674e632df504b56b', // AAAFEFSF
            'b4fc775f2bace65b68ba8c43423fab2f96c8743c54d5468b92923f70ca20ae2e', // AAAFEFSF
            '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e', // AAAFEFSF
            'f405b50dff7053f3697f485f95fe1c0f6a4f5e52446281b4ef470c2762a15dae', // AAAFEFSF
            '575df1986c414f1d74bebc2229d794e423a2371fb51bac1d3b517e5cca51b5ea', // AAAFEFSF
            '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06', // AAAFEFSF
            'e294c4c172c3d87991b0369e45d6af8584be92914d01e3060fad1ed31d12ff00', // AAAFEFSF
        ],
    },
    {
        description: 'Address label search (ignore casing)',
        search: 'aaaFEFSF',
        result: [
            'f38d1ae79872985688d92dcec6a359ca563c48a506e8766488ad1d2aa8e4ea30', // AAAFEFSF
            '905e181a3e3066a88bf848690ad32cd260ca53dc192d6f588c0344fa08363b11', // AAAFEFSF
            '65b768dacccfb209eebd95a1fb80a04f1dd6a3abc6d7b41d5e9d9f91605b37d9', // AAAFEFSF
            'e4b5b24159856ea18ab5819832da3b4a6330f9c3c0a46d96674e632df504b56b', // AAAFEFSF
            'b4fc775f2bace65b68ba8c43423fab2f96c8743c54d5468b92923f70ca20ae2e', // AAAFEFSF
            '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e', // AAAFEFSF
            'f405b50dff7053f3697f485f95fe1c0f6a4f5e52446281b4ef470c2762a15dae', // AAAFEFSF
            '575df1986c414f1d74bebc2229d794e423a2371fb51bac1d3b517e5cca51b5ea', // AAAFEFSF
            '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06', // AAAFEFSF
            'e294c4c172c3d87991b0369e45d6af8584be92914d01e3060fad1ed31d12ff00', // AAAFEFSF
        ],
    },
    {
        description: 'Higher than amount search',
        // TODO amounts in searchTransactions.json are wrongly in BTC instead of sats,
        // but it's simpler to adjust it here than in the json
        search: '> 0.0000000007',
        result: [
            'f457a1b85f84dcdaadc06f5dffb1436034bf6fa69a271a08d005f0a65aea7693', // 0.0794905 TEST
            '121afe39eaeacd0f38ff1ed4ab34dbd34aa1239a82465a112dbcde1646b01ec7', // 0.07806848 TEST
            'e294c4c172c3d87991b0369e45d6af8584be92914d01e3060fad1ed31d12ff00', // 1.29999867 TEST
        ],
    },
    {
        description: 'Lower than amount search',
        search: '< -000000000.1',
        result: [
            'a59a1761ad3fad987258c79850e397398ab8559f157bc6868a7ed4e8b742ef01', // -0.22667356 TEST
            'b4fc775f2bace65b68ba8c43423fab2f96c8743c54d5468b92923f70ca20ae2e', // -1.19999084 TEST
            '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06', // -0.1 TEST
        ],
    },
    {
        description: 'Exclude amount search',
        search: '!= -0.0000000000999888',
        notResult: [
            '62431e78bb13a4fdd9c87517db1ea70b4cb5763227327da35748c96497c6ea9a', // -0.00999888 TEST
        ],
    },
    {
        description: 'Date search',
        search: '2020-12-03',
        result: [
            '9438960e985b1de4e118cbcedf6122c2467477d768d262863ee13e981b6c2816',
            '5be0cfd5b439c3112cfaea3cd05fdcea387433990885c86937d2488c59f1e692',
        ],
    },
    {
        description: 'After date search',
        search: '> 2020-12-14',
        result: [
            '62431e78bb13a4fdd9c87517db1ea70b4cb5763227327da35748c96497c6ea9a', // 2020-12-27
            'f5cea29dec1d4e8b83a81b61627caf36adc33085284bde2969ae5beb75bd413c', // 2020-12-14
            '0xb2e15b2029bfecb74f8cfddafa35bd09f72c1c003f725c6c8391169d726f6c30', // 2026-06-02 - EVM Claim tx
        ],
    },
    {
        description: 'Before date search',
        search: '< 2018-03-20',
        result: [
            '575df1986c414f1d74bebc2229d794e423a2371fb51bac1d3b517e5cca51b5ea', // 2020-03-16
            '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06', // 2020-03-02
            'e294c4c172c3d87991b0369e45d6af8584be92914d01e3060fad1ed31d12ff00', // 2020-03-02
        ],
    },
    {
        description: 'Exclude date search',
        search: '!= 2020-12-27',
        notResult: [
            '62431e78bb13a4fdd9c87517db1ea70b4cb5763227327da35748c96497c6ea9a', // 2020-12-27
        ],
    },
    {
        description: 'AND operator (incoming December transactions only)',
        search: '> 2020-12-01 & < 2020-12-31 & > 0',
        results: [
            'f5cea29dec1d4e8b83a81b61627caf36adc33085284bde2969ae5beb75bd413c', // 2020-12-14 - 0.01 TEST
            '5be0cfd5b439c3112cfaea3cd05fdcea387433990885c86937d2488c59f1e692', // 2020-12-03 - 0.00019199 TEST
        ],
    },
    {
        description: 'OR operator (December 14th and 3rd transactions only)',
        search: '2020-12-14 | 2020-12-03 & > 0',
        results: [
            'f5cea29dec1d4e8b83a81b61627caf36adc33085284bde2969ae5beb75bd413c', // 2020-12-14 - 0.01 TEST
            '9438960e985b1de4e118cbcedf6122c2467477d768d262863ee13e981b6c2816', // 2020-12-03 - -0.00002066 TEST
            '5be0cfd5b439c3112cfaea3cd05fdcea387433990885c86937d2488c59f1e692', // 2020-12-03 - 0.00019199 TEST
        ],
    },
    {
        description: 'AND + OR operator (December 14th and 3rd incoming transactions only)',
        search: '2020-12-14 | 2020-12-03 & > 0',
        results: [
            'f5cea29dec1d4e8b83a81b61627caf36adc33085284bde2969ae5beb75bd413c', // 2020-12-14 - 0.01 TEST
            '5be0cfd5b439c3112cfaea3cd05fdcea387433990885c86937d2488c59f1e692', // 2020-12-03 - 0.00019199 TEST
        ],
    },
    {
        description: 'EVM function label search',
        search: 'claim',
        results: [
            '0xb2e15b2029bfecb74f8cfddafa35bd09f72c1c003f725c6c8391169d726f6c30', // 2026-06-02 - EVM Claim tx
        ],
    },
    {
        description: 'AND operator (EVM func Claim + < July)',
        search: 'claim & < 2026-06-01',
        results: [],
    },
];
