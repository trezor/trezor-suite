export default {
    valid: [
        {
            description: 'Peercoin transaction with time field',
            network: 'peercoin',
            id: '41b29ad615d8eea40a4654a052d18bb10cd08f203c351f4d241f88b031357d3d',
            hash: '3d7d3531b0881f244d1f353c208fd00cb18bd152a054460aa4eed815d69ab241',
            coinbase: false,
            virtualSize: 229,
            weight: 916,
            hex: '01000000d643c55d01af685f64691c1d0dc16f7450692608c6b77e722561a406e166c7de8f28e6ab67000000006a473044022052748f479c41b432352772ef7aa4b090e4f8df8d589aaea5cfc3dbef237a3935022012f53265e223c3cce6348306d7085b0538b68a52dbd99b0035a01b5bb2a8e50a0121038fa1b058febedda1a414ccb39f55ac09dd832e5c2e5af9b14ff49ea9d520b9feffffffff02a0860100000000001976a914d68a96304b1fb73aadfea0f44c17061f5e353e1b88ac689c0a00000000001976a91460223495a70ca30abcee5b93687d5fa88fa5d4ec88ac00000000',
            raw: {
                version: 1,
                locktime: 0,
                ins: [
                    {
                        hash: 'af685f64691c1d0dc16f7450692608c6b77e722561a406e166c7de8f28e6ab67',
                        index: 0,
                        data: '473044022052748f479c41b432352772ef7aa4b090e4f8df8d589aaea5cfc3dbef237a3935022012f53265e223c3cce6348306d7085b0538b68a52dbd99b0035a01b5bb2a8e50a0121038fa1b058febedda1a414ccb39f55ac09dd832e5c2e5af9b14ff49ea9d520b9fe',
                        sequence: 4294967295,
                    },
                ],
                outs: [
                    {
                        value: '100000',
                        data: '76a914d68a96304b1fb73aadfea0f44c17061f5e353e1b88ac',
                    },
                    {
                        value: '695400',
                        data: '76a91460223495a70ca30abcee5b93687d5fa88fa5d4ec88ac',
                    },
                ],
                timestamp: 1573209046,
            },
        },
        {
            description: 'Peercoin testnet transaction with time field',
            network: 'peercoin',
            id: '8dee7497750d607383107fb464d96ad3e8b0cf11ead6ffdc33feb894f9ff2519',
            hash: '1925fff994b8fe33dcffd6ea11cfb0e8d36ad964b47f108373600d759774ee8d',
            coinbase: false,
            virtualSize: 225,
            weight: 900,
            hex: '010000004462e75d013745c6bc6f2d71e773d08b48d1416dc8b0b34934e1d76e965cc5d7fdbc9191e20100000049483045022100a77283393fa19d96b1e374666be2c7b484d59b13d2712fdcf4ae1f3028efe56202207ade134b5aedb7c1d0f701ce517a9c9039c887b30aba118ed4e7a847e2053be401ffffffff03000000000000000000d0e88a7f0000000023210226241f079c9db94bef3fff80749a42d6cba0efd3be01564be8a63755866bc832acbeeb8a7f0000000023210226241f079c9db94bef3fff80749a42d6cba0efd3be01564be8a63755866bc832ac00000000',
            raw: {
                version: 1,
                locktime: 0,
                ins: [
                    {
                        hash: '3745c6bc6f2d71e773d08b48d1416dc8b0b34934e1d76e965cc5d7fdbc9191e2',
                        index: 1,
                        data: '483045022100a77283393fa19d96b1e374666be2c7b484d59b13d2712fdcf4ae1f3028efe56202207ade134b5aedb7c1d0f701ce517a9c9039c887b30aba118ed4e7a847e2053be401',
                        sequence: 4294967295,
                    },
                ],
                outs: [
                    {
                        value: '0',
                        data: '',
                    },
                    {
                        value: '2139810000',
                        data: '210226241f079c9db94bef3fff80749a42d6cba0efd3be01564be8a63755866bc832ac',
                    },
                    {
                        value: '2139810750',
                        data: '210226241f079c9db94bef3fff80749a42d6cba0efd3be01564be8a63755866bc832ac',
                    },
                ],
                timestamp: 1575445060,
            },
        },
    ],
};
