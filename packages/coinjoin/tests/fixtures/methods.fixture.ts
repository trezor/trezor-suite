export const SEGWIT_XPUB =
    'vpub5YX1yJFY8E236pH3iNvCpThsXLxoQoC4nwraaS5h4TZwaSp1Gg9SQoxCsrumxjh7nZRQQkNfH29TEDeMvAZVmD3rpmsDnFc5Sj4JgJG6m4b';

export const SEGWIT_RECEIVE_ADDRESSES = [
    'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v', // receive 1
    'bcrt1qldlynaqp0hy4zc2aag3pkenzvxy65saej0huey', // receive 2
    'bcrt1q9l0rk0gkgn73d0gc57qn3t3cwvucaj3h98jwg4', // receive 3
    'bcrt1qtxe2hdle9he8hc2xds7yl2m8zutjksv0gmszw2', // receive 4
    'bcrt1qglrv8xrtf68udd5pxj2pxyq5s7lynq204v2da8', // receive 5
];

export const SEGWIT_CHANGE_ADDRESSES = [
    'bcrt1qejqxwzfld7zr6mf7ygqy5s5se5xq7vmt8ntmj0', // change 1
    'bcrt1qze76uzqteg6un6jfcryrxhwvfvjj58tsdeh9xy', // change 2
    'bcrt1qr5p6f5sk09sms57ket074vywfymuthlg7y8tn0', // change 3
    'bcrt1qwn0s88t9r39g72m78mcaxj72sy3ct4m4dulavf', // change 4
    'bcrt1qguznsd2hyl69gjx2axd6f5qu9k274qj9v5syhd', // change 5
];

export const BASE_HEIGHT = 0;
export const BASE_HASH = 'craigwrightisafraud';

// hash + filter must be always preserved for the filters to work
export const BLOCKS = [
    {
        height: 1,
        hash: '09f69854a4572575e2a8af0dea70ff5efd46957e2cb60e81c0d760098ab48b44',
        filter: '01656c90', // receive 1 out
        previousBlockHash: BASE_HASH,
        txs: [
            {
                txid: '11111111111111111111111111111111',
                filter: '03928f707d3166a2ea',
                blockHeight: 1,
                blockTime: 1337,
                value: '1578597058',
                fees: '28059',
                vin: [
                    {
                        n: 0,
                        addresses: ['mkUzYq8aQ4xzgPoCw8QVsRzkn1dceiPzmi'],
                        isAddress: true,
                        value: '1578625117',
                    },
                ],
                vout: [
                    {
                        value: '578597058',
                        n: 0,
                        spent: true,
                        addresses: ['n29Q5yZh813J4MHtY4KjteNs1rfRWVRRPJ'],
                        isAddress: true,
                    },
                    {
                        value: '1000000000',
                        n: 1,
                        spent: true,
                        addresses: ['bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v'],
                        isAddress: true,
                    },
                ],
            },
        ],
    },
    {
        height: 2,
        hash: '5513d63651bbb32985b54fa9e0e530553e3e9cebdd10feae7f019c04edb80f61',
        filter: '0298ad7857d0c0', // receive 1 in, receive 2 out
        previousBlockHash: '09f69854a4572575e2a8af0dea70ff5efd46957e2cb60e81c0d760098ab48b44',
        txs: [
            {
                txid: '22222222222222222222222222222222',
                filter: '021944359ad6e0',
                blockHeight: 2,
                blockTime: 1337,
                value: '999999890',
                fees: '110',
                vin: [
                    {
                        n: 0,
                        addresses: ['bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v'],
                        isAddress: true,
                        value: '1000000000',
                        txid: '11111111111111111111111111111111',
                        vout: 1,
                    },
                ],
                vout: [
                    {
                        value: '999999890',
                        n: 0,
                        spent: true,
                        addresses: ['bcrt1qldlynaqp0hy4zc2aag3pkenzvxy65saej0huey'],
                        isAddress: true,
                    },
                ],
            },
        ],
    },
    {
        height: 3,
        hash: '295578a3c8eb87736a5e657b06a0933f7ec5f82c43f8418fdb38f74c0fc066c7',
        filter: '0802a1103e91e638632d0f148d8c4618cc6118aeaad3d0', // nothing
        previousBlockHash: '5513d63651bbb32985b54fa9e0e530553e3e9cebdd10feae7f019c04edb80f61',
        txs: [],
    },
    {
        height: 4,
        hash: '12de06b8ae4bbc660e3f565c876c606f5a1bd3463364c6abfc882b5ff6dd86e3',
        filter: '03018bfa4d4731ee2480', // receive 1 out
        previousBlockHash: '295578a3c8eb87736a5e657b06a0933f7ec5f82c43f8418fdb38f74c0fc066c7',
        txs: [
            {
                txid: '33333333333333333333333333333333',
                filter: '031e20cd856d4fa3f1',
                blockHeight: 4,
                blockTime: 1337,
                value: '999999858',
                fees: '142',
                vin: [
                    {
                        n: 0,
                        addresses: [
                            'bcrt1pswrqtykue8r89t9u4rprjs0gt4qzkdfuursfnvqaa3f2yql07zmq2fdmpx',
                        ],
                        isAddress: true,
                        value: '1000000000',
                    },
                ],
                vout: [
                    {
                        value: '547',
                        n: 0,
                        addresses: ['bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v'],
                        isAddress: true,
                    },
                    {
                        value: '999999311',
                        n: 1,
                        spent: true,
                        addresses: [
                            'bcrt1pn2d0yjeedavnkd8z8lhm566p0f2utm3lgvxrsdehnl94y34txmtsef5dqz',
                        ],
                        isAddress: true,
                    },
                ],
            },
        ],
    },
    {
        height: 5,
        hash: '2c2c65aad93eebe235955e170913fd6558453dd999a4ded6249bbdc9d54da1f7',
        filter: '08a4afd740dddb6185ca00666d22a55fc9252008f9cda0', // nothing
        previousBlockHash: '12de06b8ae4bbc660e3f565c876c606f5a1bd3463364c6abfc882b5ff6dd86e3',
        txs: [],
    },
    {
        height: 6,
        hash: '5021a2185f27ad04d45f1b53c873b2231311aea99e0f1d7a6252167540b9db4c',
        filter: '03a69058941e6f5fc1', // receive 2 in, receive 1 out, change 1 out'
        previousBlockHash: '2c2c65aad93eebe235955e170913fd6558453dd999a4ded6249bbdc9d54da1f7',
        txs: [
            {
                txid: '44444444444444444444444444444444',
                filter: '034a680453fcd11cf180',
                blockHeight: 6,
                blockTime: 1337,
                value: '999999749',
                fees: '141',
                vin: [
                    {
                        n: 0,
                        addresses: ['bcrt1qldlynaqp0hy4zc2aag3pkenzvxy65saej0huey'],
                        isAddress: true,
                        value: '999999890',
                        txid: '22222222222222222222222222222222',
                    },
                ],
                vout: [
                    {
                        value: '547',
                        n: 0,
                        spent: true,
                        addresses: ['bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v'],
                        isAddress: true,
                    },
                    {
                        value: '999999202',
                        n: 1,
                        spent: true,
                        addresses: ['bcrt1qejqxwzfld7zr6mf7ygqy5s5se5xq7vmt8ntmj0'],
                        isAddress: true,
                    },
                ],
            },
        ],
    },
    {
        height: 7,
        hash: '01d37c4490e9ddaf6b5c886eaa215b8d0b658c93ea42cfd871b226f606672c0b',
        filter: '023eee59053e40', // receive 1 in, change 1 in, receive 1 out'
        previousBlockHash: '5021a2185f27ad04d45f1b53c873b2231311aea99e0f1d7a6252167540b9db4c',
        txs: [
            {
                txid: '55555555555555555555555555555555',
                filter: '0262fbd3058600',
                blockHeight: 7,
                blockTime: 1337,
                value: '999999571',
                fees: '178',
                vin: [
                    {
                        n: 0,
                        addresses: ['bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v'],
                        isAddress: true,
                        value: '547',
                        txid: '44444444444444444444444444444444',
                    },
                    {
                        n: 1,
                        addresses: ['bcrt1qejqxwzfld7zr6mf7ygqy5s5se5xq7vmt8ntmj0'],
                        isAddress: true,
                        value: '999999202',
                        txid: '44444444444444444444444444444444',
                        vout: 1,
                    },
                ],
                vout: [
                    {
                        value: '999999571',
                        n: 0,
                        addresses: ['bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v'],
                        isAddress: true,
                    },
                ],
            },
        ],
    },
    {
        height: 8,
        hash: '36d01c975372c363d94f0e9e22e8a61a6a52e3408c98920ef1587b024ec487e3',
        filter: '02782a5165c980', // receive 1 out
        previousBlockHash: '01d37c4490e9ddaf6b5c886eaa215b8d0b658c93ea42cfd871b226f606672c0b',
        txs: [
            {
                txid: '66666666666666666666666666666666',
                filter: '0256bf6979ccc0',
                blockHeight: 8,
                blockTime: 1337,
                value: '999999212',
                fees: '99',
                vin: [
                    {
                        n: 0,
                        addresses: [
                            'bcrt1pn2d0yjeedavnkd8z8lhm566p0f2utm3lgvxrsdehnl94y34txmtsef5dqz',
                        ],
                        isAddress: true,
                        value: '999999311',
                    },
                ],
                vout: [
                    {
                        value: '999999212',
                        n: 0,
                        addresses: ['bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v'],
                        isAddress: true,
                    },
                ],
            },
        ],
    },
];

export const TX_4_PENDING = {
    ...BLOCKS[5].txs[0],
    blockHeight: -1,
    blockTime: undefined,
};

export const SEGWIT_XPUB_RESULT = {
    descriptor:
        'vpub5YX1yJFY8E236pH3iNvCpThsXLxoQoC4nwraaS5h4TZwaSp1Gg9SQoxCsrumxjh7nZRQQkNfH29TEDeMvAZVmD3rpmsDnFc5Sj4JgJG6m4b',
    balance: '1999999330',
    availableBalance: '1999999330',
    empty: false,
    addresses: {
        change: [
            {
                address: 'bcrt1qejqxwzfld7zr6mf7ygqy5s5se5xq7vmt8ntmj0',
                path: "m/84'/1'/0'/1/0",
                transfers: 2,
                balance: '0',
                sent: '999999202',
                received: '999999202',
            },
            {
                address: 'bcrt1qze76uzqteg6un6jfcryrxhwvfvjj58tsdeh9xy',
                path: "m/84'/1'/0'/1/1",
                transfers: 0,
            },
            {
                address: 'bcrt1qr5p6f5sk09sms57ket074vywfymuthlg7y8tn0',
                path: "m/84'/1'/0'/1/2",
                transfers: 0,
            },
            {
                address: 'bcrt1qwn0s88t9r39g72m78mcaxj72sy3ct4m4dulavf',
                path: "m/84'/1'/0'/1/3",
                transfers: 0,
            },
            {
                address: 'bcrt1qguznsd2hyl69gjx2axd6f5qu9k274qj9v5syhd',
                path: "m/84'/1'/0'/1/4",
                transfers: 0,
            },
            {
                address: 'bcrt1q8zx9dlztqz9apm7y5gtx8a0tlz57fhncycvun5',
                path: "m/84'/1'/0'/1/5",
                transfers: 0,
            },
            {
                address: 'bcrt1qger2dlc2mykcavfxs0ad8eupr058njwp2e8n6m',
                path: "m/84'/1'/0'/1/6",
                transfers: 0,
            },
            {
                address: 'bcrt1qjm4p4nykvsczt26llswppmfe7xraane9nfruqv',
                path: "m/84'/1'/0'/1/7",
                transfers: 0,
            },
            {
                address: 'bcrt1qm3sx7jlgj7yd3y2ad0jm587k98pcc2x5wfq5jf',
                path: "m/84'/1'/0'/1/8",
                transfers: 0,
            },
            {
                address: 'bcrt1qcvgld0z38vnx9fnpsgwuc583838ldv8sf38pwz',
                path: "m/84'/1'/0'/1/9",
                transfers: 0,
            },
            {
                address: 'bcrt1quja53ex7clst8yhkwenhy8p67aa36kedqszlun',
                path: "m/84'/1'/0'/1/10",
                transfers: 0,
            },
            {
                address: 'bcrt1qlxvp7fwy0azketw0afgw0snxssyphmtthe4g8g',
                path: "m/84'/1'/0'/1/11",
                transfers: 0,
            },
            {
                address: 'bcrt1ql02lgacsfm543teeymtw2p7xz9unxe6572mxeh',
                path: "m/84'/1'/0'/1/12",
                transfers: 0,
            },
            {
                address: 'bcrt1qnuafw94yvu6td7tcfqea823y342ttrc9d32qnx',
                path: "m/84'/1'/0'/1/13",
                transfers: 0,
            },
            {
                address: 'bcrt1q92khcru77q7hrctf7ter2kltpgtrz23nhnkcaz',
                path: "m/84'/1'/0'/1/14",
                transfers: 0,
            },
            {
                address: 'bcrt1qu8ts4a80ylfq7hgy9aqt0rk65gekmt5p029ymm',
                path: "m/84'/1'/0'/1/15",
                transfers: 0,
            },
            {
                address: 'bcrt1qc0zg0xrs0grvrmr0hrq7u0rdthadsrk406w0dk',
                path: "m/84'/1'/0'/1/16",
                transfers: 0,
            },
            {
                address: 'bcrt1quvm4wfs9pjrqvr4rmy60k8uevg009jhtx9zzxr',
                path: "m/84'/1'/0'/1/17",
                transfers: 0,
            },
            {
                address: 'bcrt1qetngs772lxz97x94v9ycfjtwelmu7aqmuu5vkl',
                path: "m/84'/1'/0'/1/18",
                transfers: 0,
            },
            {
                address: 'bcrt1qaydzjvcf0qnfxs9aw8zmazt88f6j0wjtgqqn22',
                path: "m/84'/1'/0'/1/19",
                transfers: 0,
            },
            {
                address: 'bcrt1qlecqdxptwt65c52uqzmdqk9njyt4rmygf2vsvd',
                path: "m/84'/1'/0'/1/20",
                transfers: 0,
            },
            {
                address: 'bcrt1qcd7flxasgwn0mk3hszfwcnywsmt3nv6pkyfue4',
                path: "m/84'/1'/0'/1/21",
                transfers: 0,
            },
            {
                address: 'bcrt1qwfwwhurm2qwrm5t836zj8yme8nqq55703l3xp2',
                path: "m/84'/1'/0'/1/22",
                transfers: 0,
            },
            {
                address: 'bcrt1qr5vc4ldeh35numf0sr7tddvkw2ww5wtu4m3nn5',
                path: "m/84'/1'/0'/1/23",
                transfers: 0,
            },
            {
                address: 'bcrt1q8jxu8sjrx7wz5cslupct2g3d724qheenwfr8ne',
                path: "m/84'/1'/0'/1/24",
                transfers: 0,
            },
            {
                address: 'bcrt1qklq0mjkju72wvvj4xw4fl2nfkzljerjkq5cj6e',
                path: "m/84'/1'/0'/1/25",
                transfers: 0,
            },
            {
                address: 'bcrt1q2ytsdz2mzv04m7ty373ntqnnqcjpqfllfjjl8v',
                path: "m/84'/1'/0'/1/26",
                transfers: 0,
            },
            {
                address: 'bcrt1qshw6c9pxrxhe78rv3yxntx7l205qxpdzltz58m',
                path: "m/84'/1'/0'/1/27",
                transfers: 0,
            },
            {
                address: 'bcrt1qg5artwauue8xq0zhcvl5rv7wz8cdjy6ga5f95j',
                path: "m/84'/1'/0'/1/28",
                transfers: 0,
            },
            {
                address: 'bcrt1qnrcfh3wsvs8tnk58d0dzgl47k0qmdxyqrwaqcw',
                path: "m/84'/1'/0'/1/29",
                transfers: 0,
            },
            {
                address: 'bcrt1qygthhkrmw39090xna84c575m8sfwgm2sqvrs2f',
                path: "m/84'/1'/0'/1/30",
                transfers: 0,
            },
            {
                address: 'bcrt1q5tpzfctscgvwaj276kxaf6tkfa2l35rcwl35xf',
                path: "m/84'/1'/0'/1/31",
                transfers: 0,
            },
            {
                address: 'bcrt1q5ac3l6fcjgs6s9gptxslfp5m49gcleg4s8cz0g',
                path: "m/84'/1'/0'/1/32",
                transfers: 0,
            },
            {
                address: 'bcrt1qafwugfusvd4c7pdwqy6nrdc5n8mrmnukd0mrvh',
                path: "m/84'/1'/0'/1/33",
                transfers: 0,
            },
            {
                address: 'bcrt1q84hwcup9d326ctu3x05e9s74nt9565q0u5ejjj',
                path: "m/84'/1'/0'/1/34",
                transfers: 0,
            },
            {
                address: 'bcrt1q0x76cx65yx8jpd3pamf2c7d84sekmrs64dwww8',
                path: "m/84'/1'/0'/1/35",
                transfers: 0,
            },
            {
                address: 'bcrt1qgps3pj77rrrcvpphdw2yaqwlv3x6w95lscju76',
                path: "m/84'/1'/0'/1/36",
                transfers: 0,
            },
            {
                address: 'bcrt1qka9j8r3n3utc3qtg3v4lsnxnhn5zks5sd8ryju',
                path: "m/84'/1'/0'/1/37",
                transfers: 0,
            },
            {
                address: 'bcrt1qqmtf9f0yrr0mq7t4c0h8ezdsfwn5p87aqe2xdl',
                path: "m/84'/1'/0'/1/38",
                transfers: 0,
            },
            {
                address: 'bcrt1qn7rfsgdp4edu2auukphm9d8gfc5h7tk9y2q8zj',
                path: "m/84'/1'/0'/1/39",
                transfers: 0,
            },
            {
                address: 'bcrt1qhtx908walvleuryd940x7pgwkycmwq8rlv3p2v',
                path: "m/84'/1'/0'/1/40",
                transfers: 0,
            },
            {
                address: 'bcrt1qh7lsaxngm53pmea6m2evwla3kz25auja8ww6qz',
                path: "m/84'/1'/0'/1/41",
                transfers: 0,
            },
            {
                address: 'bcrt1qaa8r4fg5e7ner8zynkr9m42drwxl5qu3leydak',
                path: "m/84'/1'/0'/1/42",
                transfers: 0,
            },
            {
                address: 'bcrt1q0gz24yavwayqwzmratecm6navw8zr2mesh9n20',
                path: "m/84'/1'/0'/1/43",
                transfers: 0,
            },
            {
                address: 'bcrt1qxawuc27h4h0zxkqze03a4r54jmdnxx6lzql0m5',
                path: "m/84'/1'/0'/1/44",
                transfers: 0,
            },
            {
                address: 'bcrt1qlwa2kqvl6wynhj02vcqwudfuhq78a4fyqgeja0',
                path: "m/84'/1'/0'/1/45",
                transfers: 0,
            },
            {
                address: 'bcrt1qnfmw0xvwmn0v6kj6l3ra05u9n0c0vl0kspulu0',
                path: "m/84'/1'/0'/1/46",
                transfers: 0,
            },
            {
                address: 'bcrt1q80626n3qccynt9krkuju4nsg9q7405p65a58h8',
                path: "m/84'/1'/0'/1/47",
                transfers: 0,
            },
            {
                address: 'bcrt1qpcr0w6hkplc54zfdj62nqhkdm8vgtdtqh53htf',
                path: "m/84'/1'/0'/1/48",
                transfers: 0,
            },
            {
                address: 'bcrt1qlfvws24zz5tjlak7f2pygd4c54s66ykxrxjn8t',
                path: "m/84'/1'/0'/1/49",
                transfers: 0,
            },
            {
                address: 'bcrt1qzvluxcz8dutuhxk6mm694zwh6td9d4kx4h8jkm',
                path: "m/84'/1'/0'/1/50",
                transfers: 0,
            },
        ],
        used: [
            {
                address: 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v',
                path: "m/84'/1'/0'/0/0",
                transfers: 6,
                balance: '1999999330',
                sent: '1000000547',
                received: '2999999877',
            },
            {
                address: 'bcrt1qldlynaqp0hy4zc2aag3pkenzvxy65saej0huey',
                path: "m/84'/1'/0'/0/1",
                transfers: 2,
                balance: '0',
                sent: '999999890',
                received: '999999890',
            },
        ],
        unused: [
            {
                address: 'bcrt1q9l0rk0gkgn73d0gc57qn3t3cwvucaj3h98jwg4',
                path: "m/84'/1'/0'/0/2",
                transfers: 0,
            },
            {
                address: 'bcrt1qtxe2hdle9he8hc2xds7yl2m8zutjksv0gmszw2',
                path: "m/84'/1'/0'/0/3",
                transfers: 0,
            },
            {
                address: 'bcrt1qglrv8xrtf68udd5pxj2pxyq5s7lynq204v2da8',
                path: "m/84'/1'/0'/0/4",
                transfers: 0,
            },
            {
                address: 'bcrt1qds6ygc07t7d8prjs60qnx0nv4gexx9hex07wwl',
                path: "m/84'/1'/0'/0/5",
                transfers: 0,
            },
            {
                address: 'bcrt1q86udlgffezp9kgjvqlfah7a6c8dpepameugfw5',
                path: "m/84'/1'/0'/0/6",
                transfers: 0,
            },
            {
                address: 'bcrt1q503m8pxyvf7ypurcvwv2kp0ajyjumsjq5ad7xq',
                path: "m/84'/1'/0'/0/7",
                transfers: 0,
            },
            {
                address: 'bcrt1qg805w4uhsz3sy9stasdx2rkwp4haf446ew055v',
                path: "m/84'/1'/0'/0/8",
                transfers: 0,
            },
            {
                address: 'bcrt1qy2f6mkfa3aaecqz2s2xr0utf6edza7qzh7gnnn',
                path: "m/84'/1'/0'/0/9",
                transfers: 0,
            },
            {
                address: 'bcrt1q4tm6cgxd3m7uqgzmwxfclruqz894qdv5w05kss',
                path: "m/84'/1'/0'/0/10",
                transfers: 0,
            },
            {
                address: 'bcrt1qguvdun4cjty8js34wswdn4nv2ne7jamajjwgkj',
                path: "m/84'/1'/0'/0/11",
                transfers: 0,
            },
            {
                address: 'bcrt1qp6py2d8acmqcvdfeht3escetv5aunru5d4vlk0',
                path: "m/84'/1'/0'/0/12",
                transfers: 0,
            },
            {
                address: 'bcrt1q88fkyl4zxrcejt4s75ynkunpps3n9kchzvnaw8',
                path: "m/84'/1'/0'/0/13",
                transfers: 0,
            },
            {
                address: 'bcrt1qjfvfjqsp3khtgdkqw87up39skp6zvp062q7y93',
                path: "m/84'/1'/0'/0/14",
                transfers: 0,
            },
            {
                address: 'bcrt1qf49m5zxk9957z8yzyfed6glrcvz3r7y4demdex',
                path: "m/84'/1'/0'/0/15",
                transfers: 0,
            },
            {
                address: 'bcrt1qfmej7qk4f66vx8a5aq5t5nlvp0hxuwe0fg9rrp',
                path: "m/84'/1'/0'/0/16",
                transfers: 0,
            },
            {
                address: 'bcrt1qlfxf67wwud59ru0d4e7qa36zh0daxcfr6ec53g',
                path: "m/84'/1'/0'/0/17",
                transfers: 0,
            },
            {
                address: 'bcrt1qcmmen68dyt59pkh7dv2xxf07tme7qxzn0upszf',
                path: "m/84'/1'/0'/0/18",
                transfers: 0,
            },
            {
                address: 'bcrt1qpcgw9fuec7wjjnq8rl0cwfwa7mqvrheud24890',
                path: "m/84'/1'/0'/0/19",
                transfers: 0,
            },
            {
                address: 'bcrt1qxukydnhdldsjf0c8rguxmja9kxsydjzwj486hk',
                path: "m/84'/1'/0'/0/20",
                transfers: 0,
            },
            {
                address: 'bcrt1qq7tkmktggcwp46jefmnh7ytade562ka8qte4un',
                path: "m/84'/1'/0'/0/21",
                transfers: 0,
            },
        ],
    },
    history: {
        total: 6,
        unconfirmed: 0,
        transactions: [
            {
                type: 'recv',
                txid: '66666666666666666666666666666666',
                blockTime: 1337,
                blockHeight: 8,
                amount: '999999212',
                fee: '99',
                targets: [
                    {
                        n: 0,
                        addresses: ['bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v'],
                        isAddress: true,
                        amount: '999999212',
                        isAccountTarget: true,
                    },
                ],
                tokens: [],
                details: {
                    vin: [
                        {
                            n: 0,
                            addresses: [
                                'bcrt1pn2d0yjeedavnkd8z8lhm566p0f2utm3lgvxrsdehnl94y34txmtsef5dqz',
                            ],
                            isAddress: true,
                            value: '999999311',
                            isAccountOwned: undefined,
                        },
                    ],
                    vout: [
                        {
                            value: '999999212',
                            n: 0,
                            addresses: ['bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v'],
                            isAddress: true,
                            isAccountOwned: true,
                        },
                    ],
                    totalInput: '999999311',
                    totalOutput: '999999212',
                },
            },
            {
                type: 'self',
                txid: '55555555555555555555555555555555',
                blockTime: 1337,
                blockHeight: 7,
                amount: '178',
                fee: '178',
                targets: [
                    {
                        n: 0,
                        addresses: ['bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v'],
                        isAddress: true,
                        amount: '999999571',
                        isAccountTarget: true,
                    },
                ],
                tokens: [],
                details: {
                    vin: [
                        {
                            n: 0,
                            addresses: ['bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v'],
                            isAddress: true,
                            value: '547',
                            isAccountOwned: true,
                        },
                        {
                            n: 1,
                            addresses: ['bcrt1qejqxwzfld7zr6mf7ygqy5s5se5xq7vmt8ntmj0'],
                            isAddress: true,
                            value: '999999202',
                        },
                    ],
                    vout: [
                        {
                            value: '999999571',
                            n: 0,
                            addresses: ['bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v'],
                            isAddress: true,
                            isAccountOwned: true,
                        },
                    ],
                    totalInput: '999999749',
                    totalOutput: '999999571',
                },
            },
            {
                type: 'self',
                txid: '44444444444444444444444444444444',
                blockTime: 1337,
                blockHeight: 6,
                amount: '141',
                fee: '141',
                targets: [
                    {
                        n: 0,
                        addresses: ['bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v'],
                        isAddress: true,
                        amount: '547',
                        isAccountTarget: true,
                    },
                ],
                tokens: [],
                details: {
                    vin: [
                        {
                            n: 0,
                            addresses: ['bcrt1qldlynaqp0hy4zc2aag3pkenzvxy65saej0huey'],
                            isAddress: true,
                            value: '999999890',
                        },
                    ],
                    vout: [
                        {
                            value: '547',
                            n: 0,
                            spent: true,
                            addresses: ['bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v'],
                            isAddress: true,
                            isAccountOwned: true,
                        },
                        {
                            value: '999999202',
                            n: 1,
                            spent: true,
                            addresses: ['bcrt1qejqxwzfld7zr6mf7ygqy5s5se5xq7vmt8ntmj0'],
                            isAddress: true,
                        },
                    ],
                    totalInput: '999999890',
                    totalOutput: '999999749',
                },
            },
            {
                type: 'recv',
                txid: '33333333333333333333333333333333',
                blockTime: 1337,
                blockHeight: 4,
                amount: '547',
                fee: '142',
                targets: [
                    {
                        n: 0,
                        addresses: ['bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v'],
                        isAddress: true,
                        amount: '547',
                        isAccountTarget: true,
                    },
                ],
                tokens: [],
                details: {
                    vin: [
                        {
                            n: 0,
                            addresses: [
                                'bcrt1pswrqtykue8r89t9u4rprjs0gt4qzkdfuursfnvqaa3f2yql07zmq2fdmpx',
                            ],
                            isAddress: true,
                            value: '1000000000',
                            isAccountOwned: undefined,
                        },
                    ],
                    vout: [
                        {
                            value: '547',
                            n: 0,
                            addresses: ['bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v'],
                            isAddress: true,
                            isAccountOwned: true,
                        },
                        {
                            value: '999999311',
                            n: 1,
                            spent: true,
                            addresses: [
                                'bcrt1pn2d0yjeedavnkd8z8lhm566p0f2utm3lgvxrsdehnl94y34txmtsef5dqz',
                            ],
                            isAddress: true,
                            isAccountOwned: undefined,
                        },
                    ],
                    totalInput: '1000000000',
                    totalOutput: '999999858',
                },
            },
            {
                type: 'self',
                txid: '22222222222222222222222222222222',
                blockTime: 1337,
                blockHeight: 2,
                amount: '110',
                fee: '110',
                targets: [
                    {
                        n: 0,
                        addresses: ['bcrt1qldlynaqp0hy4zc2aag3pkenzvxy65saej0huey'],
                        isAddress: true,
                        amount: '999999890',
                        isAccountTarget: true,
                    },
                ],
                tokens: [],
                details: {
                    vin: [
                        {
                            n: 0,
                            addresses: ['bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v'],
                            isAddress: true,
                            value: '1000000000',
                            isAccountOwned: true,
                        },
                    ],
                    vout: [
                        {
                            value: '999999890',
                            n: 0,
                            spent: true,
                            addresses: ['bcrt1qldlynaqp0hy4zc2aag3pkenzvxy65saej0huey'],
                            isAddress: true,
                        },
                    ],
                    totalInput: '1000000000',
                    totalOutput: '999999890',
                },
            },
            {
                type: 'recv',
                txid: '11111111111111111111111111111111',
                blockTime: 1337,
                blockHeight: 1,
                amount: '1000000000',
                fee: '28059',
                targets: [
                    {
                        n: 1,
                        addresses: ['bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v'],
                        isAddress: true,
                        amount: '1000000000',
                        isAccountTarget: true,
                    },
                ],
                tokens: [],
                details: {
                    vin: [
                        {
                            n: 0,
                            addresses: ['mkUzYq8aQ4xzgPoCw8QVsRzkn1dceiPzmi'],
                            isAddress: true,
                            value: '1578625117',
                            isAccountOwned: undefined,
                        },
                    ],
                    vout: [
                        {
                            value: '578597058',
                            n: 0,
                            spent: true,
                            addresses: ['n29Q5yZh813J4MHtY4KjteNs1rfRWVRRPJ'],
                            isAddress: true,
                            isAccountOwned: undefined,
                        },
                        {
                            value: '1000000000',
                            n: 1,
                            spent: true,
                            addresses: ['bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v'],
                            isAddress: true,
                            isAccountOwned: true,
                        },
                    ],
                    totalInput: '1578625117',
                    totalOutput: '1578597058',
                },
            },
        ],
    },
    page: { index: 1, size: 25, total: 1 },
    utxo: [
        {
            address: 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v',
            path: "m/84'/1'/0'/0/0",
            txid: '33333333333333333333333333333333',
            vout: 0,
            blockHeight: 4,
            amount: '547',
            confirmations: 1,
        },
        {
            address: 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v',
            path: "m/84'/1'/0'/0/0",
            txid: '55555555555555555555555555555555',
            vout: 0,
            blockHeight: 7,
            amount: '999999571',
            confirmations: 1,
        },
        {
            address: 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v',
            path: "m/84'/1'/0'/0/0",
            txid: '66666666666666666666666666666666',
            vout: 0,
            blockHeight: 8,
            amount: '999999212',
            confirmations: 1,
        },
    ],
};

const {
    addresses: {
        unused,
        used: [used1, used2],
        change: [{ balance, sent, received, transfers, ...change1 }, ...change],
    },
    history: {
        transactions: [, , pending, ...transactions],
    },
    utxo: [utxo],
    ...rest
} = SEGWIT_XPUB_RESULT;

export const SEGWIT_XPUB_RESULT_HALF = {
    ...rest,
    balance: '1000000437',
    availableBalance: '1000000296',
    addresses: {
        unused,
        used: [
            {
                ...used1,
                balance: '547',
                received: '1000000547',
                sent: '1000000000',
                transfers: 3,
            },
            { ...used2, balance: '999999890', received: '999999890', sent: '0', transfers: 1 },
        ],
        change: [{ ...change1, transfers: 0 }, ...change.slice(0, 19)],
    },
    history: {
        total: 3,
        unconfirmed: 1,
        transactions: [{ ...pending, blockHeight: -1, blockTime: undefined }, ...transactions],
    },
    utxo: [
        utxo,
        {
            txid: '44444444444444444444444444444444',
            vout: 0,
            address: 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v',
            path: "m/84'/1'/0'/0/0",
            blockHeight: -1,
            confirmations: 0,
            amount: '547',
        },
        {
            txid: '44444444444444444444444444444444',
            vout: 1,
            address: 'bcrt1qejqxwzfld7zr6mf7ygqy5s5se5xq7vmt8ntmj0',
            path: "m/84'/1'/0'/1/0",
            blockHeight: -1,
            confirmations: 0,
            amount: '999999202',
        },
    ],
};

const {
    addresses,
    history: {
        transactions: [
            tx6,
            tx5,
            tx4,
            tx3,
            {
                targets: [{ isAccountTarget, ...tx2Target }],
                ...tx2
            },
            tx1,
        ],
        ...xpubHistory
    },
    utxo: [
        { address: addr1, path: p1, ...utxo1 },
        { address: addr2, path: p2, ...utxo2 },
        { address: addr3, path: p3, ...utxo3 },
    ],
    ...xpubRest
} = SEGWIT_XPUB_RESULT;

export const SEGWIT_RECEIVE_RESULT = {
    ...xpubRest,
    descriptor: 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v',
    balance: '1999999330',
    availableBalance: '1999999330',
    history: {
        ...xpubHistory,
        transactions: [
            tx6,
            { ...tx5, type: 'joint', amount: '999999024', targets: [] },
            { ...tx4, type: 'recv', amount: '547' },
            tx3,
            {
                ...tx2,
                type: 'sent',
                amount: '999999890',
                targets: [tx2Target],
            },
            tx1,
        ],
    },
    utxo: [utxo1, utxo2, utxo3],
};
