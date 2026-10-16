import {
    type Account,
    type CryptoBaseCurrencyPair,
    type RatesByTimestamps,
    type TickerId,
    type Timestamp,
    type WalletAccountTransaction,
    asTimestamp,
    toTokenAddress,
} from '@suite-common/wallet-types';
import {
    getErc4626Contracts,
    getFiatRateKeyFromTicker,
    isNftTokenTransfer,
    isTestnet,
    roundTimestampToNearestPastHour,
} from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { type HistoricFiatRatesQueryArgs } from './fiatRatesApi';

type GetMissingHistoricFiatRatesQueryArgsParams = {
    account: Account;
    transactions: readonly WalletAccountTransaction[];
    historicFiatRates: RatesByTimestamps;
    baseCurrencyCode: BaseCurrencyCode;
};

type TickerTimestamps = {
    ticker: TickerId;
    timestamps: Set<Timestamp>;
};

/**
 * Returns one query per coin or token of the account that has transactions without a known
 * historic rate. Each query asks only for the missing transaction hours.
 */
export const getMissingHistoricFiatRatesQueryArgs = ({
    account,
    transactions,
    historicFiatRates,
    baseCurrencyCode,
}: GetMissingHistoricFiatRatesQueryArgsParams): HistoricFiatRatesQueryArgs[] => {
    if (isTestnet(account.symbol)) {
        return [];
    }

    // Historical ERC4626 rates cannot be calculated without historical share-to-asset ratios.
    const erc4626Contracts = getErc4626Contracts(account.tokens);
    const missingTimestampsByKey = new Map<CryptoBaseCurrencyPair, TickerTimestamps>();

    const addIfMissing = (ticker: TickerId, timestamp: Timestamp) => {
        const fiatRateKey = getFiatRateKeyFromTicker(ticker, baseCurrencyCode);
        const knownRate = historicFiatRates[fiatRateKey]?.[timestamp];

        if (knownRate !== undefined && knownRate !== 0) {
            return;
        }

        const tickerTimestamps = missingTimestampsByKey.get(fiatRateKey);
        if (tickerTimestamps) {
            tickerTimestamps.timestamps.add(timestamp);
        } else {
            missingTimestampsByKey.set(fiatRateKey, { ticker, timestamps: new Set([timestamp]) });
        }
    };

    transactions.forEach(transaction => {
        if (transaction.blockTime === undefined) {
            return;
        }

        const timestamp = roundTimestampToNearestPastHour(asTimestamp(transaction.blockTime));
        addIfMissing({ symbol: account.symbol }, timestamp);

        transaction.tokens
            .filter(
                token =>
                    !isNftTokenTransfer(token) &&
                    !erc4626Contracts.has(token.contract.toLowerCase()),
            )
            .forEach(token => {
                addIfMissing(
                    { symbol: account.symbol, tokenAddress: toTokenAddress(token.contract) },
                    timestamp,
                );
            });
    });

    return Array.from(missingTimestampsByKey.values(), ({ ticker, timestamps }) => ({
        ticker,
        baseCurrencyCode,
        timestamps: Array.from(timestamps).toSorted((a, b) => a - b),
    }));
};
