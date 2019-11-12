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
            tx:
                '304402202f0046af4147a8646a1c06ef63789698756cffb5e2e380cd2740688b71bd15a302201797d6b55175b6b326257737f331f701f1c9d8271fcc990644ef12d1bf3bdf80',
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
            tx:
                '304402202f0046af4147a8646a1c06ef63789698756cffb5e2e380cd2740688b71bd15a302201797d6b55175b6b326257737f331f701f1c9d8271fcc990644ef12d1bf3bdf80',
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
            name: 'Ethereum Testnet (Ropsten)',
            worker: 'js/blockbook-worker.js',
            server: ['https://ropsten1.trezor.io', 'https://ropsten2.trezor.io'],
            debug: true,
        },
        data: {
            // address: '0x103262f243e6f67d12d6a4ea0d45302c1fa4bb0a',
            address: '0x73d0385F4d8E00C5e6504C6030F47BF6212736A8',
            accountInfoOptions: {
                page: 0,
                pageSize: 25,
                contractFilter: undefined,
                // tokens: 'derived',
                // from: 0,
                // to: 0,
            },
            estimateFeeOptions: {
                blocks: [1, 2, 10],
            },
            txid: '',
            tx: '',
            subscribe: '0x103262f243e6f67d12d6a4ea0d45302c1fa4bb0a',
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
];
