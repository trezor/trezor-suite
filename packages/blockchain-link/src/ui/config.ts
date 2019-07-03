export default [
    {
        blockchain: {
            name: 'Ripple Testnet',
            worker: 'js/ripple-worker.js',
            server: [
                // 'wss://foo1.bar',
                // 'wss://foo2.bar',
                'wss://s.altnet.rippletest.net',
            ],
            debug: false,
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
                transaction: undefined,
                levels: [{ blocks: 1 }],
            },
            tx:
                '304402202f0046af4147a8646a1c06ef63789698756cffb5e2e380cd2740688b71bd15a302201797d6b55175b6b326257737f331f701f1c9d8271fcc990644ef12d1bf3bdf80',
            subscribe:
                'rBdHGo5fksQotC4x5t7BtaR8vMW5EDqk6S,rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H,rBKz5MC2iXdoS3XgnNSYmF69K1Yo4NS3Ws',
        },
    },
    {
        blockchain: {
            name: 'Ripple Mainnet',
            worker: 'js/ripple-worker.js',
            server: ['wss://s1.ripple.com'],
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
                transaction: undefined,
                levels: [1],
            },
            tx:
                '304402202f0046af4147a8646a1c06ef63789698756cffb5e2e380cd2740688b71bd15a302201797d6b55175b6b326257737f331f701f1c9d8271fcc990644ef12d1bf3bdf80',
            // subscribe: 'rJb5KsHsDHF1YS5B5DU6QCkH5NsPaKQTcy,rsG1sNifXJxGS2nDQ9zHyoe1S5APrtwpjV'
            // subscribe: 'rMBzp8CgpE441cp5PVyA9rpVV7oT8hP3ys', // some echange (tx offers)
            subscribe: 'rPVMhWBsfF9iMXYj3aAzJVkPDTFNSyWdKy', // bittrex (payments)
        },
        selected: true,
    },
    {
        blockchain: {
            name: 'Ethereum Testnet',
            worker: 'js/blockbook-worker.js',
            // server: ['wss://blockbook-dev.corp:19136'],
            server: ['wss://blockbook-dev.corp.sldev.cz:19136'],
            // server: 'https://testnet-bitcore1.trezor.io',
            // server: 'wss://ropsten1.trezor.io/socket.io/?transport=websocket',
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
            estimateFeeOptions: {},
            tx: '',
            subscribe: '0x103262f243e6f67d12d6a4ea0d45302c1fa4bb0a',
        },
    },
    {
        blockchain: {
            name: 'Bitcoin Testnet',
            worker: 'js/blockbook-worker.js',
            server: ['wss://blockbook-dev.corp.sldev.cz:19130'],
            // server: ['wss://blockbook-dev.corp.sldev.cz:9130'],
            debug: true,
        },
        data: {
            // address: 'xpub6BiVtCpG9fQPxnPmHXG8PhtzQdWC2Su4qWu6XW9tpWFYhxydCLJGrWBJZ5H6qTAHdPQ7pQhtpjiYZVZARo14qHiay2fvrX996oEP42u8wZy', // all-all legacy 1 (idk why xpub?)
            // address: 'vpub5YX1yJFY8E236pH3iNvCpThsXLxoQoC4nwraaS5h4TZwaSp1Gg9SQoxCsrumxjh7nZRQQkNfH29TEDeMvAZVmD3rpmsDnFc5Sj4JgJG6m4b', // all-all bech32 1
            // address: 'upub5DR1Mg5nykixzYjFXWW5GghAU7dDqoPVJ2jrqFbL8sJ7Hs7jn69MP7KBnnmxn88GeZtnH8PRKV9w5MMSFX8AdEAoXY8Qd8BJPoXtpMeHMxJ', // all-all segwit 1
            // address: 'tpubDDKn3FtHc74CaRrRbi1WFdJNaaenZkDWqq9NsEhcafnDZ4VuKeuLG2aKHm5SuwuLgAhRkkfHqcCxpnVNSrs5kJYZXwa6Ud431VnevzzzK3U', // all-all legacy 1

            // address: 'tpubDDKn3FtHc74CcBfxJ3zdSNnRacuggmGwv3KEZLJP2LAuqc3HhsQR5ZAVudcQzezzXs7T6QrDtoJJYvgyDUJ9vgWx3Y7Et4Ats1Q25U1LXvU', // all-all legacy 2
            // address: 'upub5DR1Mg5nykiy3TcYPKDyVC1vS9uoPBD5oyAx5oFAJwwPSEqekNFXboyDUogKicY6tRnBmMcdrFyMPfTSdm8qXSYrpnYuhXZWzQP1wU4xFhq', // all-all segwit 2

            address:
                'upub5Df5hVPH2yM4Khs85P8nkq3x9GRcvX3FgDitXDcqSJDXgMJjVmpWPRqwqHExjQcezkjDDyU1u3ij1wUPXHaYqRHehuGtBvSPzcocpKu3wUz', // (all testnet pass "a")
            accountInfoOptions: {
                page: 0,
                pageSize: 25,
                contractFilter: undefined,
            },
            estimateFeeOptions: {},
            tx: '',
            subscribe: '1G47mSr3oANXMafVrR8UC4pzV7FEAzo3r9', // Poloniex: https://www.walletexplorer.com/wallet/Poloniex.com
            // subscribe: '0x2a0c0dbecc7e4d658f48e01e3fa353f44050c208', // Poloniex: https://www.walletexplorer.com/wallet/Poloniex.com
        },
    },
    {
        blockchain: {
            name: 'Ethereum Mainnet',
            worker: 'js/blockbook-worker.js',
            server: ['https://eth1.trezor.io'],
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
            estimateFeeOptions: {},
            tx: '',
            // subscribe: '1G47mSr3oANXMafVrR8UC4pzV7FEAzo3r9', // Poloniex: https://www.walletexplorer.com/wallet/Poloniex.com
            subscribe: '0x2a0c0dbecc7e4d658f48e01e3fa353f44050c208', // Poloniex: https://www.walletexplorer.com/wallet/Poloniex.com
        },
    },
];
