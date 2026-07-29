export default [
    {
        description: 'With server error',
        params: {
            descriptor: 'A',
        },
        serverFixtures: [
            {
                method: 'GET_ACCOUNT_INFO',
                response: { data: { error: { message: 'Error message' } } },
            },
        ],
        error: 'Error message',
    },
    {
        description: 'Normal account',
        params: {
            descriptor:
                '6d17587575a3b4f0f86ebad3977e8f7e4981faa863eccf5c1467065c74fe3435943769446dd290d103fb3d360128e86de4b47faea73ffb0900c94c6a61ef9ea2',
        },
        serverFixtures: [
            {
                method: 'GET_ACCOUNT_INFO',
                response: {
                    data: {
                        descriptor:
                            '6d17587575a3b4f0f86ebad3977e8f7e4981faa863eccf5c1467065c74fe3435943769446dd290d103fb3d360128e86de4b47faea73ffb0900c94c6a61ef9ea2',
                        empty: false,
                        addresses: {
                            change: [
                                {
                                    address:
                                        'addr1q9f9jr6e48u63ym65esmrwgle84zspnrsew37gwe88e0zfy9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usxwwdwc',
                                    path: "m/1852'/1815'/0'/1/0",
                                    transfers: 5,
                                    received: '83205743',
                                    sent: '80863213',
                                },
                                {
                                    address:
                                        'addr1q99hnk2vnx708l86mujpfs9end50em9s95grhe3v4933m259ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usr7qlze',
                                    path: "m/1852'/1815'/0'/1/1",
                                    transfers: 3,
                                    received: '40515743',
                                    sent: '40347470',
                                },
                            ],
                            used: [
                                {
                                    address:
                                        'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                                    path: "m/1852'/1815'/0'/0/0",
                                    transfers: 10,
                                    received: '310409482450',
                                    sent: '310406954443',
                                },
                            ],
                            unused: [],
                        },
                        balance: '36865987',
                        availableBalance: '36865987',
                        history: {
                            total: 0,
                            unconfirmed: 0,
                            transactions: [],
                        },
                        page: {
                            index: 0,
                            size: 25,
                            total: 0,
                        },
                    },
                },
            },
        ],
        response: {
            descriptor:
                '6d17587575a3b4f0f86ebad3977e8f7e4981faa863eccf5c1467065c74fe3435943769446dd290d103fb3d360128e86de4b47faea73ffb0900c94c6a61ef9ea2',
            empty: false,
            addresses: {
                change: [
                    {
                        address:
                            'addr1q9f9jr6e48u63ym65esmrwgle84zspnrsew37gwe88e0zfy9ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usxwwdwc',
                        path: "m/1852'/1815'/0'/1/0",
                        transfers: 5,
                        received: '83205743',
                        sent: '80863213',
                    },
                    {
                        address:
                            'addr1q99hnk2vnx708l86mujpfs9end50em9s95grhe3v4933m259ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usr7qlze',
                        path: "m/1852'/1815'/0'/1/1",
                        transfers: 3,
                        received: '40515743',
                        sent: '40347470',
                    },
                ],
                used: [
                    {
                        address:
                            'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                        path: "m/1852'/1815'/0'/0/0",
                        transfers: 10,
                        received: '310409482450',
                        sent: '310406954443',
                    },
                ],
                unused: [],
            },
            balance: '36865987',
            availableBalance: '36865987',
            history: {
                transactions: [],
                total: 0,
                unconfirmed: 0,
            },
            page: {
                index: 0,
                size: 25,
                total: 0,
            },
        },
    },
];
