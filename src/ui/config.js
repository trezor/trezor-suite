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
            debug: true
        },
        data: {
            address: 'rJb5KsHsDHF1YS5B5DU6QCkH5NsPaKQTcy',
            accountInfo: {
                start: '660371D3A9B15E9781EED508090962890B99C67277E9F9024E899430D47D3FFD',
                limit: 10
            },
            tx: '304402202f0046af4147a8646a1c06ef63789698756cffb5e2e380cd2740688b71bd15a302201797d6b55175b6b326257737f331f701f1c9d8271fcc990644ef12d1bf3bdf80',
            subscribe: 'rBdHGo5fksQotC4x5t7BtaR8vMW5EDqk6S,rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H,rBKz5MC2iXdoS3XgnNSYmF69K1Yo4NS3Ws'
        },
    },
    {
        blockchain: {
            name: 'Ethereum Testnet',
            worker: 'js/blockbook-worker.js',
            // server: ['wss://blockbook-dev.corp:19136'],
            server: ['wss://blockbook-dev.corp.sldev.cz:19136'],
            // server: 'https://testnet-bitcore1.trezor.io',
            // server: 'wss://ropsten1.trezor.io/socket.io/?transport=websocket',
            debug: true
        },
        data: {
            // address: '0x103262f243e6f67d12d6a4ea0d45302c1fa4bb0a',
            address: '0x73d0385F4d8E00C5e6504C6030F47BF6212736A8',
            accountInfo: {
                start: '',
                limit: 0
            },
            tx: '',
            subscribe: '0x103262f243e6f67d12d6a4ea0d45302c1fa4bb0a'
        },
        selected: true
    },
];