import { deriveAccountTypeFromPaymentType, Account } from '../../migrations/account/v3';

describe('deriveAccountTypeFromPaymentType', () => {
    it('should derive account type correctly for each account', () => {
        const oldAccounts = [
            {
                descriptor:
                    'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                accountType: 'segwit',
                symbol: 'btc',
                networkType: 'bitcoin',
            },
            {
                descriptor:
                    "tr([5c9e228d/86'/0'/0']xpub6Bw885JisRbcKmowfBvMmCxaFHodKn1VpmRmctmJJoM8D4DzyP4qJv8ZdD9V9r3SSGjmK2KJEDnvLH6f1Q4HrobEvnCeKydNvf1eir3RHZk/<0;1>/*)",
                accountType: 'taproot',
                symbol: 'btc',
                networkType: 'bitcoin',
            },
            {
                descriptor:
                    'ypub6XKbB5DSkq8Royg8isNtGktj6bmEfGJXDs83Ad5CZ5tpDV8QofwSWQFTWP2Pv24vNdrPhquehL7vRMvSTj2GpKv6UaTQCBKZALm6RJAmxG6',
                accountType: 'segwitLegacy',
                symbol: 'btc',
                networkType: 'bitcoin',
            },
            {
                descriptor:
                    'xpub6BiVtCpG9fQPxnPmHXG8PhtzQdWC2Su4qWu6XW9tpWFYhxydCLJGrWBJZ5H6qTAHdPQ7pQhtpjiYZVZARo14qHiay2fvrX996oEP42u8wZy',
                accountType: 'legacy',
                symbol: 'btc',
                networkType: 'bitcoin',
            },
            {
                descriptor: 'ethereum-receive-address-mock',
                accountType: 'normal',
                symbol: 'eth',
                networkType: 'ethereum',
            },
        ] as unknown as Account[];

        const migratedAccounts = [
            {
                descriptor:
                    'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                accountType: 'normal',
                symbol: 'btc',
                networkType: 'bitcoin',
            },
            {
                descriptor:
                    "tr([5c9e228d/86'/0'/0']xpub6Bw885JisRbcKmowfBvMmCxaFHodKn1VpmRmctmJJoM8D4DzyP4qJv8ZdD9V9r3SSGjmK2KJEDnvLH6f1Q4HrobEvnCeKydNvf1eir3RHZk/<0;1>/*)",
                accountType: 'taproot',
                symbol: 'btc',
                networkType: 'bitcoin',
            },
            {
                descriptor:
                    'ypub6XKbB5DSkq8Royg8isNtGktj6bmEfGJXDs83Ad5CZ5tpDV8QofwSWQFTWP2Pv24vNdrPhquehL7vRMvSTj2GpKv6UaTQCBKZALm6RJAmxG6',
                accountType: 'segwit',
                symbol: 'btc',
                networkType: 'bitcoin',
            },
            {
                descriptor:
                    'xpub6BiVtCpG9fQPxnPmHXG8PhtzQdWC2Su4qWu6XW9tpWFYhxydCLJGrWBJZ5H6qTAHdPQ7pQhtpjiYZVZARo14qHiay2fvrX996oEP42u8wZy',
                accountType: 'legacy',
                symbol: 'btc',
                networkType: 'bitcoin',
            },
            {
                descriptor: 'ethereum-receive-address-mock',
                accountType: 'normal',
                symbol: 'eth',
                networkType: 'ethereum',
            },
        ];

        const result = deriveAccountTypeFromPaymentType(oldAccounts);

        expect(result).toEqual(migratedAccounts);
    });
});
