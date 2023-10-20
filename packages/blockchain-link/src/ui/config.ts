export default [
    {
        blockchain: {
            name: 'Ripple',
            worker: 'js/ripple-worker.js',
            server: ['wss://s1.ripple.com', 'wss://s-east.ripple.com', 'wss://s-west.ripple.com'],
            debug: true,
        },
        data: {
            address: 'rfkV3EoXimH6JrG1QAyofgbVhnyZZDjWSj', // address with 1 in 1 out tx
            // address: 'rJb5KsHsDHF1YS5B5DU6QCkH5NsPaKQTcy', // some exchange
            // address: 'rsG1sNifXJxGS2nDQ9zHyoe1S5APrtwpjV', // another exchange
            accountInfoOptions: {
                pageSize: 1,
                marker: {
                    ledger: 0,
                    seq: 0,
                },
                // from: 0,
                // to: 0,
            },
            estimateFeeOptions: {
                blocks: [1, 2, 10],
            },
            txid: '94E7CDAA9764D6CE8BA76220DE026FD1DD106B18020847A732829517369DD6B3',
            tx: '304402202f0046af4147a8646a1c06ef63789698756cffb5e2e380cd2740688b71bd15a302201797d6b55175b6b326257737f331f701f1c9d8271fcc990644ef12d1bf3bdf80',
            // subscribe: 'rJb5KsHsDHF1YS5B5DU6QCkH5NsPaKQTcy,rsG1sNifXJxGS2nDQ9zHyoe1S5APrtwpjV'
            // subscribe: 'rMBzp8CgpE441cp5PVyA9rpVV7oT8hP3ys', // some echange (tx offers)
            subscribe: 'rPVMhWBsfF9iMXYj3aAzJVkPDTFNSyWdKy', // bittrex (payments)
        },
    },
    {
        blockchain: {
            name: 'Ripple Testnet',
            worker: 'js/ripple-worker.js',
            server: ['wss://s.altnet.rippletest.net'],
            // server: ['wss://s.devnet.rippletest.net'],
            debug: true,
        },
        data: {
            // address: 'rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H', // (all all acc 1)
            address: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', // from http://ripplerm.github.io/ripple-wallet/
            accountInfoOptions: {
                type: 'transactions',
                page: 0,
                from: 0,
                to: 0,
            },
            estimateFeeOptions: {
                blocks: [1, 2, 10],
            },
            txid: '',
            tx: '304402202f0046af4147a8646a1c06ef63789698756cffb5e2e380cd2740688b71bd15a302201797d6b55175b6b326257737f331f701f1c9d8271fcc990644ef12d1bf3bdf80',
            subscribe:
                'rBdHGo5fksQotC4x5t7BtaR8vMW5EDqk6S,rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H,rBKz5MC2iXdoS3XgnNSYmF69K1Yo4NS3Ws',
        },
    },
    {
        blockchain: {
            name: 'Ethereum',
            worker: 'js/blockbook-worker.js',
            server: ['https://eth1.trezor.io', 'https://eth2.trezor.io'],
            debug: true,
        },
        data: {
            // address: 'xpub6BiVtCpG9fQPxnPmHXG8PhtzQdWC2Su4qWu6XW9tpWFYhxydCLJGrWBJZ5H6qTAHdPQ7pQhtpjiYZVZARo14qHiay2fvrX996oEP42u8wZy', // all-all legacy 1 (idk why xpub?)
            // address: 'vpub5YX1yJFY8E236pH3iNvCpThsXLxoQoC4nwraaS5h4TZwaSp1Gg9SQoxCsrumxjh7nZRQQkNfH29TEDeMvAZVmD3rpmsDnFc5Sj4JgJG6m4b', // all-all bech32 1
            // address: 'upub5DR1Mg5nykixzYjFXWW5GghAU7dDqoPVJ2jrqFbL8sJ7Hs7jn69MP7KBnnmxn88GeZtnH8PRKV9w5MMSFX8AdEAoXY8Qd8BJPoXtpMeHMxJ', // all-all segwit 1
            // address: 'tpubDDKn3FtHc74CaRrRbi1WFdJNaaenZkDWqq9NsEhcafnDZ4VuKeuLG2aKHm5SuwuLgAhRkkfHqcCxpnVNSrs5kJYZXwa6Ud431VnevzzzK3U', // all-all legacy 1

            // address: 'tpubDDKn3FtHc74CcBfxJ3zdSNnRacuggmGwv3KEZLJP2LAuqc3HhsQR5ZAVudcQzezzXs7T6QrDtoJJYvgyDUJ9vgWx3Y7Et4Ats1Q25U1LXvU', // all-all legacy 2
            // address: 'upub5DR1Mg5nykiy3TcYPKDyVC1vS9uoPBD5oyAx5oFAJwwPSEqekNFXboyDUogKicY6tRnBmMcdrFyMPfTSdm8qXSYrpnYuhXZWzQP1wU4xFhq', // all-all segwit 2

            address: '0x73d0385F4d8E00C5e6504C6030F47BF6212736A8', // all ETH#1
            // address: '0x2a0c0dbecc7e4d658f48e01e3fa353f44050c208', // exchange
            accountInfoOptions: {
                page: 0,
                pageSize: 25,
                contractFilter: undefined,
            },
            estimateFeeOptions: {
                blocks: [1, 2, 10],
            },
            txid: '',
            tx: '',
            // subscribe: '1G47mSr3oANXMafVrR8UC4pzV7FEAzo3r9', // Poloniex: https://www.walletexplorer.com/wallet/Poloniex.com
            subscribe: '0x2a0c0dbecc7e4d658f48e01e3fa353f44050c208', // Poloniex: https://www.walletexplorer.com/wallet/Poloniex.com
        },
    },
    {
        blockchain: {
            name: 'Ethereum Classic',
            worker: 'js/blockbook-worker.js',
            server: ['https://etc1.trezor.io', 'https://etc2.trezor.io'],
            debug: true,
        },
        data: {
            address: '',
            accountInfoOptions: {
                page: 0,
                pageSize: 25,
                contractFilter: undefined,
            },
            estimateFeeOptions: {
                blocks: [1, 2, 10],
            },
            txid: '',
            tx: '',
            subscribe: '',
        },
    },
    {
        blockchain: {
            name: 'Bitcoin',
            worker: 'js/blockbook-worker.js',
            server: [
                'https://btc1.trezor.io',
                'https://btc2.trezor.io',
                'https://btc3.trezor.io',
                'https://btc4.trezor.io',
                'https://btc5.trezor.io',
            ],
            debug: true,
        },
        data: {
            address: '',
            accountInfoOptions: {
                page: 0,
                pageSize: 25,
                contractFilter: undefined,
            },
            estimateFeeOptions: {
                blocks: [1, 2, 10],
            },
            txid: '',
            tx: '',
            subscribe: '',
        },
    },
    {
        blockchain: {
            name: 'Bitcoin Testnet',
            worker: 'js/blockbook-worker.js',
            server: ['https://tbtc1.trezor.io', 'https://tbtc2.trezor.io'],
            debug: true,
        },
        data: {
            // address: 'xpub6BiVtCpG9fQPxnPmHXG8PhtzQdWC2Su4qWu6XW9tpWFYhxydCLJGrWBJZ5H6qTAHdPQ7pQhtpjiYZVZARo14qHiay2fvrX996oEP42u8wZy', // all-all legacy 1 (idk why xpub?)
            address:
                'vpub5YX1yJFY8E236pH3iNvCpThsXLxoQoC4nwraaS5h4TZwaSp1Gg9SQoxCsrumxjh7nZRQQkNfH29TEDeMvAZVmD3rpmsDnFc5Sj4JgJG6m4b', // all-all bech32 1
            // address: 'upub5DR1Mg5nykixzYjFXWW5GghAU7dDqoPVJ2jrqFbL8sJ7Hs7jn69MP7KBnnmxn88GeZtnH8PRKV9w5MMSFX8AdEAoXY8Qd8BJPoXtpMeHMxJ', // all-all segwit 1
            // address: 'tpubDDKn3FtHc74CaRrRbi1WFdJNaaenZkDWqq9NsEhcafnDZ4VuKeuLG2aKHm5SuwuLgAhRkkfHqcCxpnVNSrs5kJYZXwa6Ud431VnevzzzK3U', // all-all legacy 1

            // address: 'tpubDDKn3FtHc74CcBfxJ3zdSNnRacuggmGwv3KEZLJP2LAuqc3HhsQR5ZAVudcQzezzXs7T6QrDtoJJYvgyDUJ9vgWx3Y7Et4Ats1Q25U1LXvU', // all-all legacy 2
            // address: 'upub5DR1Mg5nykiy3TcYPKDyVC1vS9uoPBD5oyAx5oFAJwwPSEqekNFXboyDUogKicY6tRnBmMcdrFyMPfTSdm8qXSYrpnYuhXZWzQP1wU4xFhq', // all-all segwit 2

            // address:
            //    'upub5Df5hVPH2yM4Khs85P8nkq3x9GRcvX3FgDitXDcqSJDXgMJjVmpWPRqwqHExjQcezkjDDyU1u3ij1wUPXHaYqRHehuGtBvSPzcocpKu3wUz', // (all testnet pass "a")
            accountInfoOptions: {
                page: 0,
                pageSize: 25,
                contractFilter: undefined,
            },
            estimateFeeOptions: {
                blocks: [1, 2, 10],
            },
            txid: '',
            tx: '',
            subscribe: '1G47mSr3oANXMafVrR8UC4pzV7FEAzo3r9', // Poloniex: https://www.walletexplorer.com/wallet/Poloniex.com
            // subscribe: '0x2a0c0dbecc7e4d658f48e01e3fa353f44050c208', // Poloniex: https://www.walletexplorer.com/wallet/Poloniex.com
        },
        selected: true,
    },
    {
        blockchain: {
            name: 'Bitcoin Cash',
            worker: 'js/blockbook-worker.js',
            server: [
                'https://bch1.trezor.io',
                'https://bch2.trezor.io',
                'https://bch3.trezor.io',
                'https://bch4.trezor.io',
                'https://bch5.trezor.io',
            ],
            debug: true,
        },
        data: {
            address: '',
            accountInfoOptions: {
                page: 0,
                pageSize: 25,
            },
            estimateFeeOptions: {
                blocks: [1, 2, 10],
            },
            txid: '',
            tx: '',
            subscribe: '',
        },
    },
    {
        blockchain: {
            name: 'Bitcoin Gold',
            worker: 'js/blockbook-worker.js',
            server: [
                'https://btg1.trezor.io',
                'https://btg2.trezor.io',
                'https://btg3.trezor.io',
                'https://btg4.trezor.io',
                'https://bth5.trezor.io',
            ],
            debug: true,
        },
        data: {
            address: '',
            accountInfoOptions: {
                page: 0,
                pageSize: 25,
            },
            estimateFeeOptions: {
                blocks: [1, 2, 10],
            },
            txid: '',
            tx: '',
            subscribe: '',
        },
    },
    {
        blockchain: {
            name: 'Dash',
            worker: 'js/blockbook-worker.js',
            server: [
                'https://dash1.trezor.io',
                'https://dash2.trezor.io',
                'https://dash3.trezor.io',
                'https://dash4.trezor.io',
                'https://dash5.trezor.io',
            ],
            debug: true,
        },
        data: {
            address: '',
            accountInfoOptions: {
                page: 0,
                pageSize: 25,
            },
            estimateFeeOptions: {
                blocks: [1, 2, 10],
            },
            txid: '',
            tx: '',
            subscribe: '',
        },
    },
    {
        blockchain: {
            name: 'DigiByte',
            worker: 'js/blockbook-worker.js',
            server: ['https://dgb1.trezor.io', 'https://dgb2.trezor.io'],
            debug: true,
        },
        data: {
            address: '',
            accountInfoOptions: {
                page: 0,
                pageSize: 25,
            },
            estimateFeeOptions: {
                blocks: [1, 2, 10],
            },
            txid: '',
            tx: '',
            subscribe: '',
        },
    },
    {
        blockchain: {
            name: 'Doge',
            worker: 'js/blockbook-worker.js',
            server: [
                'https://doge1.trezor.io',
                'https://doge2.trezor.io',
                'https://doge3.trezor.io',
                'https://doge4.trezor.io',
                'https://doge5.trezor.io',
            ],
            debug: true,
        },
        data: {
            address: '',
            accountInfoOptions: {
                page: 0,
                pageSize: 25,
            },
            estimateFeeOptions: {
                blocks: [1, 2, 10],
            },
            txid: '',
            tx: '',
            subscribe: '',
        },
    },
    {
        blockchain: {
            name: 'Litecoin',
            worker: 'js/blockbook-worker.js',
            server: [
                'https://ltc1.trezor.io',
                'https://ltc2.trezor.io',
                'https://ltc3.trezor.io',
                'https://ltc4.trezor.io',
                'https://ltc5.trezor.io',
            ],
            debug: true,
        },
        data: {
            address: '',
            accountInfoOptions: {
                page: 0,
                pageSize: 25,
            },
            estimateFeeOptions: {
                blocks: [1, 2, 10],
            },
            txid: '',
            tx: '',
            subscribe: '',
        },
    },
    {
        blockchain: {
            name: 'Namecoin',
            worker: 'js/blockbook-worker.js',
            server: ['https://nmc1.trezor.io', 'https://nmc2.trezor.io'],
            debug: true,
        },
        data: {
            address: '',
            accountInfoOptions: {
                page: 0,
                pageSize: 25,
            },
            estimateFeeOptions: {
                blocks: [1, 2, 10],
            },
            txid: '',
            tx: '',
            subscribe: '',
        },
    },
    {
        blockchain: {
            name: 'Vertcoin',
            worker: 'js/blockbook-worker.js',
            server: [
                'https://vtc1.trezor.io',
                'https://vtc2.trezor.io',
                'https://vtc3.trezor.io',
                'https://vtc4.trezor.io',
                'https://vtc5.trezor.io',
            ],
            debug: true,
        },
        data: {
            address: '',
            accountInfoOptions: {
                page: 0,
                pageSize: 25,
            },
            estimateFeeOptions: {
                blocks: [1, 2, 10],
            },
            txid: '',
            tx: '',
            subscribe: '',
        },
    },
    {
        blockchain: {
            name: 'ZCash',
            worker: 'js/blockbook-worker.js',
            server: [
                'https://zec1.trezor.io',
                'https://zec2.trezor.io',
                'https://zec3.trezor.io',
                'https://zec4.trezor.io',
                'https://zec5.trezor.io',
            ],
            debug: true,
        },
        data: {
            address: '',
            accountInfoOptions: {
                page: 0,
                pageSize: 25,
            },
            estimateFeeOptions: {
                blocks: [1, 2, 10],
            },
            txid: '',
            tx: '',
            subscribe: '',
        },
    },
    {
        blockchain: {
            name: 'Cardano Mainnet',
            worker: 'js/blockfrost-worker.js',
            server: ['wss://trezor-cardano-mainnet.blockfrost.io'],
            // server: ['ws://localhost:3005'],
            debug: true,
        },
        data: {
            estimateFeeOptions: {
                blocks: [1],
            },
            accountInfoOptions: {
                page: 1,
                pageSize: 25,
                contractFilter: undefined,
            },
            address:
                '6d17587575a3b4f0f86ebad3977e8f7e4981faa863eccf5c1467065c74fe3435943769446dd290d103fb3d360128e86de4b47faea73ffb0900c94c6a61ef9ea2',
            txid: '28172ea876c3d1e691284e5179fae2feb3e69d7d41e43f8023dc380115741026',
            blockNumber: '5f20df933584822601f9e3f8c024eb5eb252fe8cefb24d1317dc3d432e940ebb',
            tx: '83a400818258208911f640d452c3be4ff3d89db63b41ce048c056951286e2e28bbf8a51588ab44000181825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e32c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dc1a10b2531f021a00029519075820cb798b0bce50604eaf2e0dc89367896b18f0a6ef6b32b57e3c9f83f8ee71e608a1008182582073fea80d424276ad0978d4fe5310e8bc2d485f5f6bb3bf87612989f112ad5a7d5840c40425229749a9434763cf01b492057fd56d7091a6372eaa777a1c9b1ca508c914e6a4ee9c0d40fc10952ed668e9ad65378a28b149de6bd4204bd9f095b0a902a11907b0a1667469636b657281a266736f757263656b736f757263655f6e616d656576616c7565736675676961742076656e69616d206d696e7573',
        },
    },
    {
        blockchain: {
            name: 'Cardano Preview Testnet',
            worker: 'js/blockfrost-worker.js',
            server: ['wss://trezor-cardano-preview.blockfrost.io'],
            debug: true,
        },
        data: {
            estimateFeeOptions: {
                blocks: [1],
            },
            accountInfoOptions: {
                page: 1,
                pageSize: 25,
                contractFilter: undefined,
            },
            address:
                '6d17587575a3b4f0f86ebad3977e8f7e4981faa863eccf5c1467065c74fe3435943769446dd290d103fb3d360128e86de4b47faea73ffb0900c94c6a61ef9ea2',
            txid: '28172ea876c3d1e691284e5179fae2feb3e69d7d41e43f8023dc380115741026',
            blockNumber: '5f20df933584822601f9e3f8c024eb5eb252fe8cefb24d1317dc3d432e940ebb',
            tx: '83a400818258208911f640d452c3be4ff3d89db63b41ce048c056951286e2e28bbf8a51588ab44000181825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e32c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dc1a10b2531f021a00029519075820cb798b0bce50604eaf2e0dc89367896b18f0a6ef6b32b57e3c9f83f8ee71e608a1008182582073fea80d424276ad0978d4fe5310e8bc2d485f5f6bb3bf87612989f112ad5a7d5840c40425229749a9434763cf01b492057fd56d7091a6372eaa777a1c9b1ca508c914e6a4ee9c0d40fc10952ed668e9ad65378a28b149de6bd4204bd9f095b0a902a11907b0a1667469636b657281a266736f757263656b736f757263655f6e616d656576616c7565736675676961742076656e69616d206d696e7573',
        },
    },
    {
        blockchain: {
            name: 'Solana Mainnet',
            // we do not use path to worker build here because its not used, we use it just to match this config to actual implementation of the worker
            worker: 'solana',
            server: [
                'floral-wider-aura.solana-mainnet.quiknode.pro/dbc557c5d503280fd160a157ccc25d96923bba44/',
            ],
            debug: true,
        },
        data: {
            estimateFeeOptions: {
                // please note that fee estimation is time sensitive and this specific params are outdated
                specific: {
                    data: '01000102c80f8b50107e9f3e3c16a661b8c806df454a6deb293d5e8730a9d28f2f4998c60000000000000000000000000000000000000000000000000000000000000000c41dc0c82a686ce8dfed732687b5869180d6239c026af160a5297506ad87ea5901010200000c020000000000000000000000',
                },
            },
            accountInfoOptions: {
                page: 0,
                pageSize: 25,
            },
            address: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
            txid: '', // not implemented
            blockNumber: '', // not implemented
            // please note transaction submission is time sensitive and this specific params are outdated
            // also the transaction has already been submitted so its invalid
            tx: '016b6504fe0a54f4e30c13e4707fdea772496a932d3cb87cbf817ddad7a7924d6cae2aaf687dd57851829c2d884f1c135abad4a1a36167dcebdb28286c31d6d80b01000102c80f8b50107e9f3e3c16a661b8c806df454a6deb293d5e8730a9d28f2f4998c60000000000000000000000000000000000000000000000000000000000000000c41dc0c82a686ce8dfed732687b5869180d6239c026af160a5297506ad87ea5901010200000c0200000070ec9b0700000000',
        },
    },
];
