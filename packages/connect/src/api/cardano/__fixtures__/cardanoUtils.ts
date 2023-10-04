export const transformUtxos = [
    {
        description: 'basic',
        utxo: [
            {
                address:
                    'addr1qruhh37yvr86py46p8z23t2ca53pdng580tnju3vwyhuhtzr29tz874v5a6mz95tn6gxt5887lrvnfudhwttxkdexaeqc5gfcl',
                txid: '52e4557caec03a1678b2ad5490fbb6b100d41eec59e20d48d26718b8d4246534',
                confirmations: 47058,
                blockHeight: 3190801,
                amount: '2000000',
                vout: 0,
                path: "m/1852'/1815'/1'/0/2",
                cardanoSpecific: {
                    unit: 'lovelace',
                },
            },
        ],
        result: [
            {
                address:
                    'addr1qruhh37yvr86py46p8z23t2ca53pdng580tnju3vwyhuhtzr29tz874v5a6mz95tn6gxt5887lrvnfudhwttxkdexaeqc5gfcl',
                txHash: '52e4557caec03a1678b2ad5490fbb6b100d41eec59e20d48d26718b8d4246534',
                outputIndex: 0,
                amount: [
                    {
                        quantity: '2000000',
                        unit: 'lovelace',
                    },
                ],
            },
        ],
    },
    {
        description: 'multi asset utxo',
        utxo: [
            {
                address:
                    'addr1qry2nvhtcm79r7tleklteyqfcytg0xn6j77qcxvuf6ehhcjr29tz874v5a6mz95tn6gxt5887lrvnfudhwttxkdexaeq9d9x4h',
                txid: 'afa26bb01765a79ddc7fd02548702fb0012b77ef3f239e98a3e92dc4c0cfad1f',
                confirmations: 46756,
                blockHeight: 3191103,
                amount: '1661535',
                vout: 1,
                path: "m/1852'/1815'/1'/1/0",
                cardanoSpecific: {
                    unit: 'lovelace',
                },
            },
            {
                address:
                    'addr1qry2nvhtcm79r7tleklteyqfcytg0xn6j77qcxvuf6ehhcjr29tz874v5a6mz95tn6gxt5887lrvnfudhwttxkdexaeq9d9x4h',
                txid: 'afa26bb01765a79ddc7fd02548702fb0012b77ef3f239e98a3e92dc4c0cfad1f',
                confirmations: 46756,
                blockHeight: 3191103,
                amount: '1',
                vout: 1,
                path: "m/1852'/1815'/1'/1/0",
                cardanoSpecific: {
                    unit: '6b8d07d69639e9413dd637a1a815a7323c69c86abbafb66dbfdb1aa7',
                },
            },
            {
                address:
                    'addr1qry2nvhtcm79r7tleklteyqfcytg0xn6j77qcxvuf6ehhcjr29tz874v5a6mz95tn6gxt5887lrvnfudhwttxkdexaeq9d9x4h',
                txid: 'afa26bb01765a79ddc7fd02548702fb0012b77ef3f239e98a3e92dc4c0cfad1f',
                confirmations: 46756,
                blockHeight: 3191103,
                amount: '1000000',
                vout: 2, // different vout than previous utxo
                path: "m/1852'/1815'/1'/1/0",
                cardanoSpecific: {
                    unit: 'lovelace',
                },
            },
        ],
        result: [
            {
                address:
                    'addr1qry2nvhtcm79r7tleklteyqfcytg0xn6j77qcxvuf6ehhcjr29tz874v5a6mz95tn6gxt5887lrvnfudhwttxkdexaeq9d9x4h',
                txHash: 'afa26bb01765a79ddc7fd02548702fb0012b77ef3f239e98a3e92dc4c0cfad1f',
                outputIndex: 1,
                amount: [
                    {
                        quantity: '1661535',
                        unit: 'lovelace',
                    },
                    {
                        quantity: '1',
                        unit: '6b8d07d69639e9413dd637a1a815a7323c69c86abbafb66dbfdb1aa7',
                    },
                ],
            },
            {
                address:
                    'addr1qry2nvhtcm79r7tleklteyqfcytg0xn6j77qcxvuf6ehhcjr29tz874v5a6mz95tn6gxt5887lrvnfudhwttxkdexaeq9d9x4h',
                txHash: 'afa26bb01765a79ddc7fd02548702fb0012b77ef3f239e98a3e92dc4c0cfad1f',
                outputIndex: 2,
                amount: [
                    {
                        quantity: '1000000',
                        unit: 'lovelace',
                    },
                ],
            },
        ],
    },
];

export const prepareCertificates = [
    {
        description: 'stake registration + delegation',
        certificates: [
            {
                type: 0,
                path: "m/1852'/1815'/8'/2/0",
            },
            {
                type: 2,
                path: "m/1852'/1815'/8'/2/0",
                pool: '26b17b78de4f035dc0bfce60d1d3c3a8085c38dcce5fb8767e518bed',
            },
        ],
        result: [
            {
                type: 0,
            },
            {
                type: 2,
                pool: '26b17b78de4f035dc0bfce60d1d3c3a8085c38dcce5fb8767e518bed',
            },
        ],
    },
    {
        description: 'stake deregistration (not used, just for the coverage)',
        certificates: [
            {
                type: 1,
                path: "m/1852'/1815'/8'/2/0",
            },
        ],
        result: [
            {
                type: 1,
            },
        ],
    },
];
