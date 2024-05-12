export const transformTxFixtures = [
    {
        description:
            'should transform transaction data, omit "from", and convert units correctly 1',
        tx: {
            data: '0x3a29dbae0000000000000000000000000000000000000000000000000000000000000001',
            from: '0xCe66A9577F4e2589c1D1547B75B7A2b0807cE0ed',
            gasLimit: 416102,
            to: '0xAFA848357154a6a624686b348303EF9a13F63264',
            value: '122222000000000000',
        },
        gasPrice: '50',
        nonce: '26',
        chainId: 1,
        result: {
            data: '0x3a29dbae0000000000000000000000000000000000000000000000000000000000000001',
            gasLimit: '0x65966',
            gasPrice: '0xba43b7400',
            nonce: '0x1a',
            chainId: 1,
            to: '0xAFA848357154a6a624686b348303EF9a13F63264',
            value: '0x1b23842edbce000',
        },
    },
    {
        description:
            'should transform transaction data, omit "from", and convert units correctly 2',
        tx: {
            data: '0x3a29dbae0000000000000000000000000000000000000000000000000000000000000001',
            from: '0xCe66A9577F4e2589c1D1547B75B7A2b0807cE0ed',
            gasLimit: 300000,
            to: '0xAFA848357154a6a624686b348303EF9a13F63264',
            value: '10000',
        },
        gasPrice: '1',
        nonce: '1',
        chainId: 1,
        result: {
            data: '0x3a29dbae0000000000000000000000000000000000000000000000000000000000000001',
            gasLimit: '0x493e0',
            gasPrice: '0x3b9aca00',
            nonce: '0x1',
            chainId: 1,
            to: '0xAFA848357154a6a624686b348303EF9a13F63264',
            value: '0x2710',
        },
    },
];
