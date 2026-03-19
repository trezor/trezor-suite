import type { TrezorConnect } from '../../..';

type DiscoverAccountsParams = Parameters<TrezorConnect['discoverAccounts']>[0];
type DiscoverAccountsCoin = DiscoverAccountsParams['coins'][number];
type TsepCoin = Extract<DiscoverAccountsCoin, { symbol: 'tsep' }>;
type ThodCoin = Extract<DiscoverAccountsCoin, { symbol: 'thod' }>;

export const discoverAccounts = async (api: TrezorConnect) => {
    const tsepKnown: NonNullable<TsepCoin['known']> = [{ type: 'legacy' }];
    const tsepCoins = [{ symbol: 'tsep', known: tsepKnown }] as DiscoverAccountsParams['coins'];
    const result = await api.discoverAccounts({
        coins: tsepCoins,
    });

    if (result.success) {
        result.payload.empty.toFixed();
        result.payload.nonempty.toFixed();
        result.payload.failed.toFixed();
    }

    const thodKnown: NonNullable<ThodCoin['known']> = [{ type: 'legacy', skip: 1 }];
    const thodCoins = [{ symbol: 'thod', known: thodKnown }] as DiscoverAccountsParams['coins'];

    await api.discoverAccounts({
        coins: thodCoins,
    });

    // @ts-expect-error Trezor testnet EVM networks do not support the ledger account type.
    const invalidTsepKnown: NonNullable<TsepCoin['known']> = [{ type: 'ledger' }];
    const invalidTsepCoins = [
        { symbol: 'tsep', known: invalidTsepKnown },
    ] as DiscoverAccountsParams['coins'];
    api.discoverAccounts({ coins: invalidTsepCoins });
};
