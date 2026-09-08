import { type CryptoId } from 'invity-api';

import { getNetwork } from '@suite-common/wallet-config';
import {
    type Account,
    type BaseCurrencyAmount,
    type RatesByKey,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import { getCryptoId } from '../utils';

export type TradeableAssetBalance = {
    cryptoAmount: string;
    fiatAmount: BaseCurrencyAmount | null;
};

export type TradeableAssetBalances = ReadonlyMap<CryptoId, TradeableAssetBalance>;

type AggregatedCryptoAmount = {
    amount: BigNumber;
    symbol: Parameters<typeof getFiatRateKey>[0];
    contractAddress?: TokenAddress;
};
type AggregateTradeableAssetBalancesParams = {
    accounts: readonly Account[];
    fiatRates: RatesByKey | undefined;
    baseCurrency: BaseCurrencyCode;
};

export const aggregateTradeableAssetBalances = ({
    accounts,
    fiatRates,
    baseCurrency,
}: AggregateTradeableAssetBalancesParams): TradeableAssetBalances => {
    const amountsByCryptoId = new Map<CryptoId, AggregatedCryptoAmount>();

    const addAmount = (
        cryptoId: CryptoId,
        amount: string,
        symbol: AggregatedCryptoAmount['symbol'],
        contractAddress?: TokenAddress,
    ) => {
        const parsedAmount = new BigNumber(amount);
        if (!parsedAmount.isFinite() || !parsedAmount.gt(0)) {
            return;
        }

        const aggregatedAmount = amountsByCryptoId.get(cryptoId);
        if (aggregatedAmount) {
            aggregatedAmount.amount = aggregatedAmount.amount.plus(parsedAmount);

            return;
        }

        amountsByCryptoId.set(cryptoId, {
            amount: parsedAmount,
            symbol,
            contractAddress,
        });
    };

    accounts.forEach(account => {
        const { tradeCryptoId } = getNetwork(account.symbol);
        if (!tradeCryptoId) {
            return;
        }

        addAmount(getCryptoId(account.symbol), account.formattedBalance, account.symbol);

        account.tokens?.forEach(token => {
            if (!token.contract || !token.balance) {
                return;
            }

            const cryptoId = getCryptoId(account.symbol, token.contract);

            addAmount(cryptoId, token.balance, account.symbol, token.contract as TokenAddress);
        });
    });

    const balances = new Map<CryptoId, TradeableAssetBalance>();

    amountsByCryptoId.forEach((aggregatedAmount, cryptoId) => {
        const fiatRateKey = getFiatRateKey(
            aggregatedAmount.symbol,
            baseCurrency,
            aggregatedAmount.contractAddress,
        );

        const rate = fiatRates?.[fiatRateKey]?.rate;

        const cryptoAmount = aggregatedAmount.amount.toFixed();

        balances.set(cryptoId, {
            cryptoAmount,
            fiatAmount: toFiatCurrency({ amount: cryptoAmount, rate }),
        });
    });

    return balances;
};
