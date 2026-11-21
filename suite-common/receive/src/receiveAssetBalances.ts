import {
    type AssetId,
    type AssetKey,
    getAssetKey,
    normalizeTokenAddress,
    toTokenAddress,
} from '@suite-common/tokens';
import { type Account, type BaseCurrencyAmount, type RatesByKey } from '@suite-common/wallet-types';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

export type ReceiveAssetBalance = {
    cryptoAmount: string;
    fiatAmount: BaseCurrencyAmount | null;
};
export type ReceiveAssetBalances = ReadonlyMap<AssetKey, ReceiveAssetBalance>;

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
    const amounts = new Map<AssetKey, { assetId: AssetId; amount: BigNumber }>();
    const addAmount = (assetId: AssetId, value: string) => {
        const amount = new BigNumber(value);
        if (!amount.isFinite() || !amount.gt(0)) {
            return;
        }

        const assetKey = getAssetKey(assetId);
        amounts.set(assetKey, {
            assetId,
            amount: (amounts.get(assetKey)?.amount ?? new BigNumber(0)).plus(amount),
        });
    };
    for (const account of accounts) {
        addAmount({ networkSymbol: account.symbol }, account.formattedBalance);
        for (const token of account.tokens ?? []) {
            if (!token.contract || !token.balance) {
                continue;
            }

            addAmount(
                {
                    networkSymbol: account.symbol,
                    contractAddress: toTokenAddress(token.contract),
                },
                token.balance,
            );
        }
    }
    const balances = new Map<AssetKey, ReceiveAssetBalance>();
    for (const [assetKey, { assetId, amount }] of amounts) {
        const { networkSymbol, contractAddress } = assetId;
        const tokenAddress = contractAddress ? normalizeTokenAddress(contractAddress) : undefined;
        const rate = fiatRates?.[getFiatRateKey(networkSymbol, baseCurrency, tokenAddress)]?.rate;
        const cryptoAmount = amount.toFixed();
        balances.set(assetKey, {
            cryptoAmount,
            fiatAmount: toFiatCurrency({ amount: cryptoAmount, rate }),
        });
    }

    return balances;
};
