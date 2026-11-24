import { type AssetId, createAssetId } from '@suite-common/asset-types';
import { toTokenAddress } from '@suite-common/tokens';
import { type Account, type AssetBalance, type RatesByKey } from '@suite-common/wallet-types';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

export type ReceiveAssetBalances = ReadonlyMap<AssetId, AssetBalance>;

type AggregateReceiveAssetBalancesParams = {
    accounts: readonly Account[];
    fiatRates: RatesByKey | undefined;
    baseCurrency: Parameters<typeof getFiatRateKey>[1];
};

export const aggregateReceiveAssetBalances = ({
    accounts,
    fiatRates,
    baseCurrency,
}: AggregateReceiveAssetBalancesParams): ReceiveAssetBalances => {
    const amounts = new Map<AssetId, { amount: BigNumber; rate: number | undefined }>();
    const addAmount = (
        assetId: AssetId,
        value: string,
        rateKey: ReturnType<typeof getFiatRateKey>,
    ) => {
        const amount = new BigNumber(value);
        if (!amount.isFinite() || !amount.gt(0)) {
            return;
        }

        const existing = amounts.get(assetId);
        amounts.set(assetId, {
            amount: (existing?.amount ?? new BigNumber(0)).plus(amount),
            // Look up rates with original address casing, retaining the first available rate.
            rate: existing?.rate ?? fiatRates?.[rateKey]?.rate,
        });
    };
    for (const account of accounts) {
        addAmount(
            createAssetId({ networkSymbol: account.symbol }),
            account.formattedBalance,
            getFiatRateKey(account.symbol, baseCurrency),
        );
        for (const token of account.tokens ?? []) {
            if (!token.contract || !token.balance) {
                continue;
            }

            addAmount(
                createAssetId({
                    networkSymbol: account.symbol,
                    contractAddress: toTokenAddress(token.contract),
                }),
                token.balance,
                getFiatRateKey(account.symbol, baseCurrency, toTokenAddress(token.contract)),
            );
        }
    }
    const balances = new Map<AssetId, AssetBalance>();
    for (const [assetId, { amount, rate }] of amounts) {
        const cryptoAmount = amount.toFixed();
        balances.set(assetId, {
            cryptoAmount,
            fiatAmount: toFiatCurrency({ amount: cryptoAmount, rate }),
        });
    }

    return balances;
};
