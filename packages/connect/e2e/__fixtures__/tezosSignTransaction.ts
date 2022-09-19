const legacyResults = [
    {
        // Tezos not supported below this version
        rules: ['<2.0.8', '1'],
        success: false,
    },
];

export default {
    method: 'tezosSignTransaction',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    // all fixtures taken from connect documentation
    tests: [
        {
            description: 'Sign transaction operation',
            params: {
                path: "m/44'/1729'/10'",
                branch: 'BLGUkzwvguFu8ei8eLW3KgCbdtrMmv1UCqMvUpHHTGq1UPxypHS',
                operation: {
                    transaction: {
                        source: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
                        destination: 'tz1Kef7BSg6fo75jk37WkKRYSnJDs69KVqt9',
                        counter: 297,
                        amount: 200000,
                        fee: 10000,
                        gas_limit: 11000,
                        storage_limit: 0,
                    },
                },
            },
            result: {
                signature:
                    'edsigtj5vZPj7EUFPVRbRAXxdxiF8PUF2ARuLrG11GGPqkexYNgFjYuTqCWzNyNbqq3c5Ddp1GxNa7mqpoRoEW4NTHXDAeKFKPA',
            },
        },
        {
            description: 'Sign the first transaction of the account with reveal operation',
            params: {
                path: "m/44'/1729'/10'",
                branch: 'BLGUkzwvguFu8ei8eLW3KgCbdtrMmv1UCqMvUpHHTGq1UPxypHS',
                operation: {
                    reveal: {
                        source: 'tz1ekQapZCX4AXxTJhJZhroDKDYLHDHegvm1',
                        counter: 575424,
                        fee: 10000,
                        gas_limit: 20000,
                        storage_limit: 0,
                        public_key: 'edpkuTPqWjcApwyD3VdJhviKM5C13zGk8c4m87crgFarQboF3Mp56f',
                    },
                    transaction: {
                        source: 'tz1ekQapZCX4AXxTJhJZhroDKDYLHDHegvm1',
                        destination: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
                        counter: 575425,
                        amount: 100000,
                        fee: 10000,
                        gas_limit: 20000,
                        storage_limit: 0,
                    },
                },
            },
            result: {
                signature:
                    'edsigtijPKvQ9waqXYyqj55dd2Nw1BxJbW3zDJsuauahvsVdokAZXxrK4LfZzpR8YvqoN89XQ5ncHurXoBeJd5MjX6N77Cfq6f9',
            },
        },
        {
            description: 'origination operation',
            params: {
                path: "m/44'/1729'/0'",
                branch: 'BLHRTdZ5vUKSDbkp5vcG1m6ZTST4SRiHWUhGodysLTbvACwi77d',
                operation: {
                    origination: {
                        source: 'tz1ckrgqGGGBt4jGDmwFhtXc1LNpZJUnA9F2',
                        manager_pubkey: 'tz1ckrgqGGGBt4jGDmwFhtXc1LNpZJUnA9F2',
                        delegate: 'tz1boot1pK9h2BVGXdyvfQSv8kd1LQM6H889',
                        balance: 100000000,
                        fee: 10000,
                        counter: 20450,
                        gas_limit: 10100,
                        storage_limit: 277,
                        script: '0000001c02000000170500036805010368050202000000080316053d036d03420000000a010000000568656c6c6f',
                    },
                },
            },
            result: {
                signature:
                    'edsigthFTeSat6jsXyF3qD36n3PfbxK4C4NyMmd927tG8kmLCCFC4bd8y1X3kUvGKUbLomcJoD21Ue1Vi7A3F4WFwPeiSHEnpzv',
            },
        },
        {
            description: 'Sign delegation operation',
            params: {
                path: "m/44'/1729'/0'",
                branch: 'BLHRTdZ5vUKSDbkp5vcG1m6ZTST4SRiHWUhGodysLTbvACwi77d',
                operation: {
                    origination: {
                        source: 'tz1ckrgqGGGBt4jGDmwFhtXc1LNpZJUnA9F2',
                        manager_pubkey: 'tz1ckrgqGGGBt4jGDmwFhtXc1LNpZJUnA9F2',
                        delegate: 'tz1boot1pK9h2BVGXdyvfQSv8kd1LQM6H889',
                        balance: 100000000,
                        fee: 10000,
                        counter: 20450,
                        gas_limit: 10100,
                        storage_limit: 277,
                        script: '0000001c02000000170500036805010368050202000000080316053d036d03420000000a010000000568656c6c6f',
                    },
                },
            },
            result: {
                signature:
                    'edsigthFTeSat6jsXyF3qD36n3PfbxK4C4NyMmd927tG8kmLCCFC4bd8y1X3kUvGKUbLomcJoD21Ue1Vi7A3F4WFwPeiSHEnpzv',
            },
        },
        {
            description:
                'Sign delegation from a KT account (smart contract with `manager.tz` script)',
            params: {
                path: "m/44'/1729'/0'",
                branch: 'BMdPMLXNyMTDp4vR6g7y8mWPk7KZbjoXH3gyWD1Tze43UE3BaPm',
                operation: {
                    transaction: {
                        source: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
                        destination: 'KT1SBj7e8ZhV2VvJtoc73dNRDLRJ9P6VjuVN',
                        counter: 292,
                        amount: 0,
                        fee: 10000,
                        gas_limit: 36283,
                        storage_limit: 0,
                        parameters_manager: {
                            set_delegate: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
                        },
                    },
                },
            },
            result: {
                signature:
                    'edsigtb5kR9F7Lfz4tJPFW4nAjUPgBXKcPKHxhLJGDjwZuRAhU1JQb28xohtdG1S25DxaFtbiSzgixFffjmEHnzjAxDsxTioKWv',
            },
        },
        {
            description:
                'Sign transaction operation from a KT account (smart contract with `manager.tz` script) to a tz account (implicit account)',
            params: {
                path: "m/44'/1729'/0'",
                branch: 'BMCKRpEsFYQTdZy8BSLuFqkHmxwXrnRpKncdoVMbeGoggLG3bND',
                operation: {
                    transaction: {
                        source: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
                        destination: 'KT1SBj7e8ZhV2VvJtoc73dNRDLRJ9P6VjuVN',
                        counter: 294,
                        amount: 0,
                        fee: 10000,
                        gas_limit: 36283,
                        storage_limit: 0,
                        parameters_manager: {
                            transfer: {
                                amount: 200,
                                destination: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
                            },
                        },
                    },
                },
            },
            result: {
                signature:
                    'edsigthwscXGnNnMYZjNw4oF6HDq4FVcv1fcic6RYwFkLkJGviH9P6q4nFccD4MpCEosUPmYsDu4YDRn6NP3bQGxDwApXkZ4RnN',
            },
        },
    ].map(fixture => ({ ...fixture, legacyResults })),
};
