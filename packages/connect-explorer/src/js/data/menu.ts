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
                ],
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
                    },
                ],
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
                        name: 'using bundle',
                        url: '/method/getAccountInfo-bundle',
                    },
                    {
                        name: 'using discovery',
                        url: '/method/getAccountInfo-discovery',
                    },
                    {
                        name: 'advanced',
                        url: '/method/getAccountInfo-advanced',
                    },
                ],
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
                ],
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
                ],
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
                    },
                ],
            },
            {
                name: 'Account info',
                children: [
                    {
                        name: 'using path',
                        url: '/method/ethereumGetAccountInfo',
                    },
                    {
                        name: 'using address',
                        url: '/method/ethereumGetAccountInfo-address',
                    },
                    {
                        name: 'using bundle',
                        url: '/method/ethereumGetAccountInfo-bundle',
                    },
                    {
                        name: 'using discovery',
                        url: '/method/ethereumGetAccountInfo-discovery',
                    },
                    {
                        name: 'advanced',
                        url: '/method/ethereumGetAccountInfo-advanced',
                    },
                ],
            },
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
                ],
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
        ],
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
                    },
                ],
            },
            {
                name: 'Account info',
                children: [
                    {
                        name: 'using path',
                        url: '/method/rippleGetAccountInfo',
                    },
                    {
                        name: 'using address',
                        url: '/method/rippleGetAccountInfo-address',
                    },
                    {
                        name: 'using bundle',
                        url: '/method/rippleGetAccountInfo-bundle',
                    },
                    {
                        name: 'using discovery',
                        url: '/method/rippleGetAccountInfo-discovery',
                    },
                    {
                        name: 'advanced',
                        url: '/method/rippleGetAccountInfo-advanced',
                    },
                ],
            },
            {
                name: 'Sign transaction',
                url: '/method/rippleSignTransaction',
            },
            {
                name: 'Push transaction',
                url: '/method/ripplePushTransaction',
            },
        ],
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
                    },
                ],
            },
            {
                name: 'Sign transaction',
                url: '/method/stellarSignTransaction',
            },
        ],
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
                    },
                ],
            },
            {
                name: 'Sign transaction',
                url: '/method/nemSignTransaction',
            },
        ],
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
                ],
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
                    },
                ],
            },
            {
                name: 'Sign transaction',
                url: '/method/cardanoSignTransaction',
            },
        ],
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
                ],
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
                    },
                ],
            },
            {
                name: 'Sign transaction',
                url: '/method/tezosSignTransaction',
            },
        ],
    },
    {
        name: 'Eos',
        children: [
            {
                name: 'Get public key',
                children: [
                    {
                        name: 'export public key',
                        url: '/method/eosGetPublicKey',
                    },
                    {
                        name: 'export multiple public keys',
                        url: '/method/eosGetPublicKey-multiple',
                    },
                ],
            },
            {
                name: 'Sign transaction',
                url: '/method/eosSignTransaction',
            },
        ],
    },
    {
        name: 'Binance',
        children: [
            {
                name: 'Get public key',
                children: [
                    {
                        name: 'export public key',
                        url: '/method/binanceGetPublicKey',
                    },
                    {
                        name: 'export multiple public keys',
                        url: '/method/binanceGetPublicKey-multiple',
                    },
                ],
            },
            {
                name: 'Get address',
                children: [
                    {
                        name: 'export address',
                        url: '/method/binanceGetAddress',
                    },
                    {
                        name: 'export multiple addresses',
                        url: '/method/binanceGetAddress-multiple',
                    },
                    {
                        name: 'verify address with custom UI handler',
                        url: '/method/binanceGetAddress-validation',
                    },
                ],
            },
            {
                name: 'Sign transaction',
                children: [
                    {
                        name: 'Transfer',
                        url: '/method/binanceSignTransaction-transfer',
                    },
                    {
                        name: 'Place order',
                        url: '/method/binanceSignTransaction-placeorder',
                    },
                    {
                        name: 'Cancel order',
                        url: '/method/binanceSignTransaction-cancelorder',
                    },
                ],
            },
        ],
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
                        url: '/method/requestLogin-sync',
                    },
                    {
                        name: 'asynchronous',
                        url: '/method/requestLogin-async',
                    },
                ],
            },
            {
                name: 'Symmetrically encrypt / decrypt value',
                url: '/method/cipherKeyValue',
            },
            {
                name: 'Custom message',
                url: '/method/customMessage',
            },
        ],
    },
    {
        name: 'Device management',
        children: [
            {
                name: 'Apply settings',
                url: '/method/applySettings',
            },
            {
                name: 'Apply flags',
                url: '/method/applyFlags',
            },
            {
                name: 'Backup device',
                url: '/method/backupDevice',
            },
            {
                name: 'Change PIN',
                url: '/method/changePin',
            },
            {
                name: 'Firmware erase',
                url: '/method/firmwareErase',
            },
            {
                name: 'Firmware update',
                url: '/method/firmwareUpdate',
            },
            {
                name: 'Get features',
                url: '/method/getFeatures',
            },
            {
                name: 'Recover device',
                url: '/method/recoverDevice',
            },
            {
                name: 'Reset device',
                url: '/method/resetDevice',
            },
            {
                name: 'Wipe device',
                url: '/method/wipeDevice',
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
                    },
                ],
            },
        ],
    },
    {
        name: 'Blockchain',
        children: [
            {
                name: 'Subscribe',
                url: '/method/blockchainSubscribe',
            },
            {
                name: 'Unsubscribe',
                url: '/method/blockchainUnsubscribe',
            },
            {
                name: 'Estimate Fee',
                url: '/method/blockchainEstimateFee',
            },
            {
                name: 'Get Transactions',
                url: '/method/blockchainGetTransactions',
            },
            {
                name: 'Disconnect',
                url: '/method/blockchainDisconnect',
            },
        ],
    },
];
