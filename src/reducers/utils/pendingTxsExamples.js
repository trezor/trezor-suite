// useful data for tests
export default [
    {
        type: 'send',
        network: 'trop',
        deviceState: '4058d01c7c964787b7d06f0f32ce229088e123a042bf95aad658f1b1b99c73fc',
        deviceID: 'A21DA462908B176CEE0402C1',
        descriptor: '0x73d0385F4d8E00C5e6504C6030F47BF6212736A8',
        inputs: [
            {
                addresses: ['0x73d0385F4d8E00C5e6504C6030F47BF6212736A8'],
            },
        ],
        outputs: [
            {
                addresses: ['0x73d0385F4d8E00C5e6504C6030F47BF6212736A8', '2a', '3a'],
            },
        ],
        hash: '0x100000',
        amount: '0.01',
        fee: '0.00001',
        total: '0.01001',

        sequence: 1,
        // tokens: undefined,
        tokens: [
            {
                name: 'Name',
                shortcut: 'T01',
                value: '200',
            },
            // {
            //     name: 'Name2',
            //     shortcut: 'USD',
            //     value: '100',
            // },
        ],

        blockHeight: 0,
        blockHash: undefined,
    },
    {
        type: 'send',
        network: 'txrp',
        deviceState: '4058d01c7c964787b7d06f0f32ce229088e123a042bf95aad658f1b1b99c73fc',
        deviceID: 'A21DA462908B176CEE0402C1',
        descriptor: 'rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H',
        inputs: [
            {
                addresses: ['rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H'],
            },
        ],
        outputs: [
            {
                addresses: ['rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H', '2a', '3a'],
            },
        ],
        hash: '0x100000',
        amount: '0.01',
        fee: '0.00001',
        total: '0.01001',

        sequence: 1,
        tokens: undefined,
        // tokens: [
        //     {
        //         name: 'Name',
        //         shortcut: 'T01',
        //         value: '200',
        //     },
        //     {
        //         name: 'Name2',
        //         shortcut: 'USD',
        //         value: '100',
        //     },
        // ],

        blockHeight: 0,
        blockHash: undefined,
    },
];