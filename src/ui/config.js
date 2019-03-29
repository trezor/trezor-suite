export default [
    {
        blockchain: {
            name: 'Ripple Testnet',
            worker: 'js/ripple-worker.js',
            server: [
                //'wss://foo1.bar',
                //'wss://foo2.bar',
                'wss://s.altnet.rippletest.net',
            ],
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
                transaction: undefined,
                levels: [
                    { blocks: 1 },
                ],
            },
            tx: '304402202f0046af4147a8646a1c06ef63789698756cffb5e2e380cd2740688b71bd15a302201797d6b55175b6b326257737f331f701f1c9d8271fcc990644ef12d1bf3bdf80',
            subscribe: 'rBdHGo5fksQotC4x5t7BtaR8vMW5EDqk6S,rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H,rBKz5MC2iXdoS3XgnNSYmF69K1Yo4NS3Ws',
        },
        selected: false,
    },
    {
        blockchain: {
            name: 'Ripple Mainnet',
            worker: 'js/ripple-worker.js',
            server: [
                'wss://s1.ripple.com',
            ],
            debug: true,
        },
        data: {
            address: 'rJb5KsHsDHF1YS5B5DU6QCkH5NsPaKQTcy', // some exchange
            // address: 'rsG1sNifXJxGS2nDQ9zHyoe1S5APrtwpjV', // another exchange
            accountInfoOptions: {
                type: 'transactions',
                page: 0,
                from: 0,
                to: 0,
            },
            estimateFeeOptions: {
                transaction: undefined,
                levels: [
                    1,
                ],
            },
            tx: '304402202f0046af4147a8646a1c06ef63789698756cffb5e2e380cd2740688b71bd15a302201797d6b55175b6b326257737f331f701f1c9d8271fcc990644ef12d1bf3bdf80',
            // subscribe: 'rJb5KsHsDHF1YS5B5DU6QCkH5NsPaKQTcy,rsG1sNifXJxGS2nDQ9zHyoe1S5APrtwpjV'
            subscribe: 'rMBzp8CgpE441cp5PVyA9rpVV7oT8hP3ys',
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
                start: '',
                limit: 0,
            },
            estimateFeeOptions: {

            },
            tx: '',
            subscribe: '0x103262f243e6f67d12d6a4ea0d45302c1fa4bb0a',
        },
        selected: false,
    },
];