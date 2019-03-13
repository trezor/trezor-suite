/* @flow */

export default [
    { 
        name: 'Bitcoin',
        children: [
            {
                name: 'Get public key',
                children: [
                    { 
                        name: 'export public key',
                        url: '/method/getPublicKey',
                    },
                    { 
                        name: 'export multiple public keys',
                        url: '/method/getPublicKey-multiple',
                    },
                ]
            },
            {
                name: 'Get address',
                children: [
                    { 
                        name: 'export address',
                        url: '/method/getAddress',
                    },
                    { 
                        name: 'export multiple addresses',
                        url: '/method/getAddress-multiple',
                    },
                    { 
                        name: 'verify address with custom UI handler',
                        url: '/method/getAddress-validation',
                    }
                ]
            },
            {
                name: 'Account info',
                children: [
                    {
                        name: 'using path',
                        url: '/method/getAccountInfo',
                    },
                    {
                        name: 'using public key',
                        url: '/method/getAccountInfo-xpub',
                    },
                    {
                        name: 'using discovery',
                        url: '/method/getAccountInfo-discovery',
                    }
                ]
            },
            {
                name: 'Sign transaction',
                children: [
                    { 
                        name: 'PAYTOADDRESS',
                        url: '/method/signTransaction-paytoaddress',
                    },
                    { 
                        name: 'PAYTOP2SHWITNESS',
                        url: '/method/signTransaction-p2sh',
                    },
                    { 
                        name: 'OPRETURN',
                        url: '/method/signTransaction-opreturn',
                    },
                    { 
                        name: 'Multisig',
                        url: '/method/signTransaction-multisig',
                    },
                    { 
                        name: 'Zcash overwintered',
                        url: '/method/signTransaction-zcash',
                    },
                    { 
                        name: 'Custom',
                        url: '/method/signTransaction-custom',
                    },
                    // { 
                    //     name: 'offline',
                    //     url: '/method/signTransaction-offline',
                    // },
                ]
            },
            {
                name: 'Push transaction',
                url: '/method/pushTransaction',
            },
            {
                name: 'Compose transaction',
                url: '/method/composeTransaction',
            },
            {
                name: 'Sign message',
                url: '/method/signMessage',
            },
            {
                name: 'Verify message',
                url: '/method/verifyMessage',
            },
        ],
    },
    {
        name: 'Ethereum',
        children: [
            {
                name: 'Get public key',
                children: [
                    { 
                        name: 'export public key',
                        url: '/method/ethereumGetPublicKey',
                    },
                    { 
                        name: 'export multiple public keys',
                        url: '/method/ethereumGetPublicKey-multiple',
                    },
                ]
            },
            {
                name: 'Get address',
                children: [
                    { 
                        name: 'export address',
                        url: '/method/ethereumGetAddress',
                    },
                    { 
                        name: 'export multiple addresses',
                        url: '/method/ethereumGetAddress-multiple',
                    },
                    { 
                        name: 'verify address with custom UI handler',
                        url: '/method/ethereumGetAddress-validation',
                    }
                ]
            },
            // {
            //     name: 'Account info',
            //     url: '/eth-accountinfo',
            // },
            {
                name: 'Sign transaction',
                children: [
                    { 
                        name: 'regular',
                        url: '/method/ethereumSignTransaction',
                    },
                    { 
                        name: 'ERC 20',
                        url: '/method/ethereumSignTransaction-erc20',
                    },
                ]
            },
            {
                name: 'Push transaction',
                url: '/method/ethereumPushTransaction',
            },
            {
                name: 'Sign message',
                url: '/method/ethereumSignMessage',
            },
            {
                name: 'Verify message',
                url: '/method/ethereumVerifyMessage',
            },
            
        ]
    },
    {
        name: 'Ripple',
        children: [
            {
                name: 'Get address',
                children: [
                    { 
                        name: 'export address',
                        url: '/method/rippleGetAddress',
                    },
                    { 
                        name: 'export multiple addresses',
                        url: '/method/rippleGetAddress-multiple',
                    },
                    { 
                        name: 'verify address with custom UI handler',
                        url: '/method/rippleGetAddress-validation',
                    }
                ]
            },
            // {
            //     name: 'Account info',
            //     url: '/ripple-accountinfo',
            // },
            {
                name: 'Sign transaction',
                url: '/method/rippleSignTransaction',
            },
            {
                name: 'Push transaction',
                url: '/method/ripplePushTransaction',
            },
        ]
    },
    {
        name: 'Stellar',
        children: [
            {
                name: 'Get address',
                children: [
                    { 
                        name: 'export address',
                        url: '/method/stellarGetAddress',
                    },
                    { 
                        name: 'export multiple addresses',
                        url: '/method/stellarGetAddress-multiple',
                    },
                    { 
                        name: 'verify address with custom UI handler',
                        url: '/method/stellarGetAddress-validation',
                    }
                ]
            },
            {
                name: 'Sign transaction',
                url: '/method/stellarSignTransaction',
            },
        ]
    },
    {
        name: 'NEM',
        children: [
            {
                name: 'Get address',
                children: [
                    { 
                        name: 'export address',
                        url: '/method/nemGetAddress',
                    },
                    { 
                        name: 'export multiple addresses',
                        url: '/method/nemGetAddress-multiple',
                    },
                    { 
                        name: 'verify address with custom UI handler',
                        url: '/method/nemGetAddress-validation',
                    }
                ]
            },
            {
                name: 'Sign transaction',
                url: '/method/nemSignTransaction',
            },
        ]
    },
    {
        name: 'Cardano',
        children: [
            {
                name: 'Get public key',
                children: [
                    { 
                        name: 'export public key',
                        url: '/method/cardanoGetPublicKey',
                    },
                    { 
                        name: 'export multiple public keys',
                        url: '/method/cardanoGetPublicKey-multiple',
                    },
                ]
            },
            {
                name: 'Get address',
                children: [
                    { 
                        name: 'export address',
                        url: '/method/cardanoGetAddress',
                    },
                    { 
                        name: 'export multiple addresses',
                        url: '/method/cardanoGetAddress-multiple',
                    },
                    { 
                        name: 'verify address with custom UI handler',
                        url: '/method/cardanoGetAddress-validation',
                    }
                ]
            },
            {
                name: 'Sign transaction',
                url: '/method/cardanoSignTransaction',
            },
        ]
    },
    {
        name: 'Lisk',
        children: [
            {
                name: 'Get public key',
                children: [
                    { 
                        name: 'export public key',
                        url: '/method/liskGetPublicKey',
                    },
                    { 
                        name: 'export multiple public keys',
                        url: '/method/liskGetPublicKey-multiple',
                    },
                ]
            },
            {
                name: 'Get address',
                children: [
                    { 
                        name: 'export address',
                        url: '/method/liskGetAddress',
                    },
                    { 
                        name: 'export multiple addresses',
                        url: '/method/liskGetAddress-multiple',
                    },
                    { 
                        name: 'verify address with custom UI handler',
                        url: '/method/liskGetAddress-validation',
                    }
                ]
            },
            {
                name: 'Sign transaction',
                url: '/method/liskSignTransaction',
            },
            {
                name: 'Sign message',
                url: '/method/liskSignMessage',
            },
            {
                name: 'Verify message',
                url: '/method/liskVerifyMessage',
            },
        ]
    },
    {
        name: 'Tezos',
        children: [
            {
                name: 'Get public key',
                children: [
                    { 
                        name: 'export public key',
                        url: '/method/tezosGetPublicKey',
                    },
                    { 
                        name: 'export multiple public keys',
                        url: '/method/tezosGetPublicKey-multiple',
                    },
                ]
            },
            {
                name: 'Get address',
                children: [
                    { 
                        name: 'export address',
                        url: '/method/tezosGetAddress',
                    },
                    { 
                        name: 'export multiple addresses',
                        url: '/method/tezosGetAddress-multiple',
                    },
                    { 
                        name: 'verify address with custom UI handler',
                        url: '/method/tezosGetAddress-validation',
                    }
                ]
            },
            {
                name: 'Sign transaction',
                url: '/method/tezosSignTransaction',
            },
        ]
    },
    {
        name: 'Other methods',
        children: [
            {
                name: 'Request login',
                url: '/method/requestLogin',
                children: [
                    { 
                        name: 'synchronous',
                        url: '/method/requestLogin-sync'
                    },
                    { 
                        name: 'asynchronous',
                        url: '/method/requestLogin-async'
                    }
                ]
            },
            {
                name: 'Symmetrically encrypt / decrypt value',
                url: '/method/cipherKeyValue',
            },
            {
                name: 'Custom message',
                url: '/method/customMessage',
            },
        ]
    },
    {
        name: 'Device management',
        children: [
            {
                name: 'Get features',
                url: '/method/getFeatures',
            },
            {
                name: 'Wipe device',
                url: '/method/wipeDevice',
            },
            {
                name: 'Reset device',
                url: '/method/resetDevice',
            },
            {
                name: 'DebugLink',
                children: [
                    {
                        name: 'Get state',
                        url: '/method/debugLinkGetState',
                    },
                    {
                        name: 'Decision',
                        url: '/method/debugLinkDecision',
                    }
                ]
            }
            
        ]
    },
    // {
    //     name: 'Blockchain',
    //     children: [
    //         {
    //             name: 'Subscribe',
    //             url: '/method/blockchainSubscribe',
    //         },
    //         {
    //             name: 'Unsubscribe',
    //             url: '/method/blockchainUnsubscribe',
    //         },
    //         {
    //             name: 'Disconnect',
    //             url: '/method/blockchainDisconnect',
    //         },
            
    //     ]
    // }
];