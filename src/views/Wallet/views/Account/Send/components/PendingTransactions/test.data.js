export default [
    {
        type: 'recv',
        timestamp: '16:20',
        address: 'a',
        deviceState: 'a',
        status: 'pending',
        confirmations: 0,
        inputs: [
            {
                addresses: ['in1'],
            },
            {
                addresses: ['in2'],
            },
        ],
        outputs: [
            {
                addresses: ['out1', 'out2'],
            },
        ],
        sequence: 1,
        hash: '1234',
        network: 'eth',
        currency: 'eth',
        amount: '0.001',
        total: '0.001001',
        fee: '0.000001',
    },

    {
        type: 'send',
        address: 'a',
        deviceState: 'a',
        confirmations: 0,
        status: 'pending',
        inputs: [
            {
                addresses: ['in1', 'in2'],
            },
        ],
        outputs: [
            {
                addresses: ['out1'],
            },
        ],
        sequence: 1,
        hash: '12345',
        network: 'eth',
        currency: 'T01',
        amount: '0.001',
        total: '0.001001',
        fee: '0.000001',
    },

    {
        address: '0x73d0385F4d8E00C5e6504C6030F47BF6212736A8',
        amount: '1',
        confirmations: 0,
        currency: 'T01',
        deviceState: '4058d01c7c964787b7d06f0f32ce229088e123a042bf95aad658f1b1b99c73fc',
        fee: '0.0002',
        hash: '0xbf6ac83bdf29abacbca91cd4100ddd5cd8de16e72911ea7d1daec17ccbfc6099',
        inputs: [{
            addresses: ['0x73d0385F4d8E00C5e6504C6030F47BF6212736A8'],
        }],
        network: 'trop',
        outputs: [{
            addresses: ['0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15'],
        }],
        sequence: 249,
        status: 'pending',
        timestamp: '',
        total: '0.0002',
        type: 'send',
    },

    {
        address: '0x73d0385F4d8E00C5e6504C6030F47BF6212736A8',
        amount: '1',
        confirmations: 0,
        currency: 'trop',
        deviceState: '4058d01c7c964787b7d06f0f32ce229088e123a042bf95aad658f1b1b99c73fc',
        fee: '0.0002',
        hash: '0xbf6ac83bdf29abacbca91cd4100ddd5cd8de16e72911ea7d1daec17ccbfc6099',
        inputs: [{
            addresses: ['0x73d0385F4d8E00C5e6504C6030F47BF6212736A8'],
        }],
        network: 'trop',
        outputs: [{
            addresses: ['0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15'],
        }],
        sequence: 249,
        status: 'pending',
        timestamp: '',
        total: '0.0002',
        type: 'send',
    },
];