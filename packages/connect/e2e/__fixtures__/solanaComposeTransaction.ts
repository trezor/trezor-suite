export default {
    method: 'solanaComposeTransaction',
    setup: {
        mnemonic: undefined, // device is not used in this test case
    },
    tests: [
        {
            description: 'Basic SOL transfer',
            params: {
                fromAddress: 'ANctUhC7YZPueiv4T8bkDcHYEAJ7Hwoxhvgnr2QkF8uR',
                toAddress: '5Q9c3XoBef8BYA5RzSmogWnRrQas6HPwYuo4AYPafpom',
                amount: '0.01',
                blockHash: 'BXim2ZLR2UZ4JQxhNGaGngbRaySWej4x8zqaw7TJ4GLo',
                lastValidBlockHeight: 290999279,
                coin: 'sol',
            },
            result: {
                serializedTx:
                    '0100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010002048b42f51ed008e27e643818f0503bdfeb6535dc815e3a9fd41a7ce42344f888dc415cd5ca15bbbbcf07713fe3f690ebaab81c9cfa8f8a95f91b17deabb953b83400000000000000000000000000000000000000000000000000000000000000000306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a400000009c7382bc11ef07feb1a080bc78d2f7f6906ae7cb7c389057fd99ae3e97c811e00303000502400d030003000903a086010000000000020200010c020000008096980000000000',
                additionalInfo: {
                    isCreatingAccount: false,
                },
            },
        },
        {
            description: 'SOL token transfer',
            params: {
                fromAddress: 'ANctUhC7YZPueiv4T8bkDcHYEAJ7Hwoxhvgnr2QkF8uR',
                toAddress: '5Q9c3XoBef8BYA5RzSmogWnRrQas6HPwYuo4AYPafpom',
                amount: '1',
                token: {
                    mint: 'HBoNJ5v8g71s2boRivrHnfSB5MVPLDHHyVjruPfhGkvL',
                    program: 'spl-token',
                    decimals: 1,
                    accounts: [
                        {
                            publicKey: '6EjZ73R3oEUHQL4zczkx3pRD3acysP3ug7hwMAdzdtNQ',
                            balance: '30',
                        },
                    ],
                },
                blockHash: 'HaVyjCbyqQa2sbwXTLKskNretcsRVws6VEBYP6xZMKm',
                lastValidBlockHeight: 290999384,
                coin: 'sol',
            },
            result: {
                serializedTx:
                    '0100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010003068b42f51ed008e27e643818f0503bdfeb6535dc815e3a9fd41a7ce42344f888dc4dcf19bed853ae158e8c5ad250530e09f8fb4b82bee35ec1a3c89d30b2b183f559e1abe20307a4f7ed6e586aea367e24b7d9f5c6d4d0969a72d9d0dd3436abe10306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a40000000f07f39f63a83ade085f851ca297f39b6993fd7b0fccba5e3aff7511fad40da3906ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9043f2bcc70fd3420cfbdcdd1da062d993dd46072ab2da56948d6ba1006138da00303000502400d030003000903a0860100000000000504010402000a0c0a0000000000000001',
                additionalInfo: {
                    isCreatingAccount: false,
                    tokenAccountInfo: {
                        baseAddress: '5Q9c3XoBef8BYA5RzSmogWnRrQas6HPwYuo4AYPafpom',
                        tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                        tokenMint: 'HBoNJ5v8g71s2boRivrHnfSB5MVPLDHHyVjruPfhGkvL',
                        tokenAccount: '73rsTqUoMd34Y3YwXtu4An2LkncLF9SeDY6TGUFfksfe',
                    },
                },
            },
        },
        {
            description: 'SOL token transfer - new account',
            params: {
                fromAddress: 'ANctUhC7YZPueiv4T8bkDcHYEAJ7Hwoxhvgnr2QkF8uR',
                toAddress: 'Aey9o8JXzTcQdjJVrV4Y56xzt5qHkLPWLgAQmaodUojm',
                amount: '1',
                token: {
                    mint: 'HBoNJ5v8g71s2boRivrHnfSB5MVPLDHHyVjruPfhGkvL',
                    program: 'spl-token',
                    decimals: 1,
                    accounts: [
                        {
                            publicKey: '6EjZ73R3oEUHQL4zczkx3pRD3acysP3ug7hwMAdzdtNQ',
                            balance: '30',
                        },
                    ],
                },
                blockHash: 'FuVcUvTCAEAefjSb7twrdnM98KFuxPhe9idGNZ3jb4zT',
                lastValidBlockHeight: 290999698,
                coin: 'sol',
            },
            result: {
                serializedTx:
                    '0100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010006098b42f51ed008e27e643818f0503bdfeb6535dc815e3a9fd41a7ce42344f888dc297187b6006964cafcb0a71cdf7d16cf80563debd388a20ed2beae6de8f0e23d4dcf19bed853ae158e8c5ad250530e09f8fb4b82bee35ec1a3c89d30b2b183f500000000000000000000000000000000000000000000000000000000000000008f7329c364a8e1d0376058cc672d81ce5ff8585a46c0adcb918ca7e3f0dc82a08c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f8590306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a40000000f07f39f63a83ade085f851ca297f39b6993fd7b0fccba5e3aff7511fad40da3906ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9dd762ba278d68a101267dbdcd6b7e6e1a84e080acdf553ba8caf0d072fbb6d200406000502400d030006000903a0860100000000000506000104070308000804020701000a0c0a0000000000000001',
                additionalInfo: {
                    isCreatingAccount: true,
                    newTokenAccountProgramName: 'spl-token',
                    tokenAccountInfo: {
                        baseAddress: 'Aey9o8JXzTcQdjJVrV4Y56xzt5qHkLPWLgAQmaodUojm',
                        tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                        tokenMint: 'HBoNJ5v8g71s2boRivrHnfSB5MVPLDHHyVjruPfhGkvL',
                        tokenAccount: '3nn86A71hFhoqYgPqLWSXdoxUwtfJNWoevBQUouAjSEg',
                    },
                },
            },
        },
    ],
};
