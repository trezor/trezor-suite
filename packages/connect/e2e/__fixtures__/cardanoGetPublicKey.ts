export default {
    method: 'cardanoGetPublicKey',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: "m/44'/1815'/0'/0/0'",
            params: {
                path: "m/44'/1815'/0'/0/0'",
            },
            result: {
                publicKey:
                    'a938c8554ae04616cfaae7cd0eb557475082c4e910242ce774967e0bd7492408cbf6ab47c8eb1a0477fc40b25dbb6c4a99454edb97d6fe5acedd3e238ef46fe0',
            },
        },
        {
            description: "m/44'/1815'",
            params: {
                path: "m/44'/1815'",
            },
            result: false,
        },
        {
            description: "m/44'/1815'/0/0/0",
            params: {
                path: "m/44'/1815'/0/0/0",
            },
            result: {
                publicKey:
                    '17cc0bf978756d0d5c76f931629036a810c61801b78beecb44555773d13e3791646ac4a6295326bae6831be05921edfbcb362de48dfd37b12e74c227dfad768d',
            },
        },
        {
            description: "m/44'/1815'/0'/0/0",
            params: {
                path: "m/44'/1815'/0'/0/0",
            },
            result: {
                publicKey:
                    'b90fb812a2268e9569ff1172e8daed1da3dc7e72c7bded7c5bcb7282039f90d5fd8e71c1543de2cdc7f7623130c5f2cceb53549055fa1f5bc88199989e08cce7',
            },
        },
        {
            description: "m/1852'/1815'/0'",
            params: {
                path: "m/1852'/1815'/0'",
            },
            result: {
                publicKey:
                    'd507c8f866691bd96e131334c355188b1a1d0b2fa0ab11545075aab332d77d9eb19657ad13ee581b56b0f8d744d66ca356b93d42fe176b3de007d53e9c4c4e7a',
            },
        },
        {
            description: "m/1852'/1815'/0'/0/0",
            params: {
                path: "m/1852'/1815'/0'/0/0",
            },
            result: {
                publicKey:
                    '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1f123474e140a2c360b01f0fa66f2f22e2e965a5b07a80358cf75f77abbd66088',
            },
        },
    ],
};
