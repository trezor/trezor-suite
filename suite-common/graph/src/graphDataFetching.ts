import { type useDispatch } from 'react-redux';

import { A, D, F, G, O, pipe } from '@mobily/ts-belt';
import { fromUnixTime, getUnixTime } from 'date-fns';

import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { fetchTransactionsFromNowUntilTimestamp } from '@suite-common/wallet-core';
import { type Timestamp, type TokenAddress } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { type AccountBalanceHistory as AccountMovementHistory } from '@trezor/blockchain-link';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import TrezorConnect, { type AccountInfo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { getAccountHistoryMovementFromTransactions } from './balanceHistoryUtils';
import {
    NUMBER_OF_POINTS,
    isIgnoredBalanceHistoryCoin,
    isLocalBalanceHistoryCoin,
} from './constants';
import {
    findOldestBalanceMovementTimestamp,
    getTimestampsInTimeFrame,
    mapCryptoBalanceMovementToFixedTimeFrame,
    mergeMultipleFiatBalanceHistories,
} from './graphUtils';
import type {
    AccountBalanceHistoryWithTokens,
    AccountHistoryBalancePoint,
    AccountHistoryMovementItem,
    AccountItem,
    AccountWithBalanceHistory,
    FiatGraphPoint,
    FiatGraphPointWithCryptoBalance,
    FiatRatesItem,
} from './types';

export const addBalanceForAccountMovementHistory = (
    data: AccountMovementHistory[] | AccountHistoryMovementItem[],
    symbol: NetworkSymbol,
    initialBalance = '0',
): AccountHistoryBalancePoint[] => {
    let balance = new BigNumber(initialBalance);

    // // sort data from newest to oldest
    const dataSorted = A.sort<AccountMovementHistory | AccountHistoryMovementItem>(
        data,
        (a, b) => b.time - a.time,
    );

    const historyWithBalance = dataSorted.map(dataPoint => {
        // subtract sentToSelf field as we don't want to include amounts received/sent to the same account
        const normalizedReceived = dataPoint.sentToSelf
            ? new BigNumber(dataPoint.received).minus(dataPoint.sentToSelf || 0)
            : dataPoint.received;
        const normalizedSent = dataPoint.sentToSelf
            ? new BigNumber(dataPoint.sent).minus(dataPoint.sentToSelf || 0)
            : dataPoint.sent;

        balance = new BigNumber(balance).minus(normalizedReceived).plus(normalizedSent);

        return {
            time: dataPoint.time,
            cryptoBalance: formatNetworkAmount(balance.toFixed(), symbol),
        };
    });

    // sort data from oldest to newest
    historyWithBalance.sort((a, b) => a.time - b.time);

    return historyWithBalance;
};

const getLatestAccountInfo = async ({
    symbol,
    identity,
    descriptor,
}: {
    symbol: NetworkSymbol;
    identity?: string;
    descriptor: string;
}) => {
    const accountInfo = await TrezorConnect.getAccountInfo({
        coin: symbol,
        identity,
        descriptor,
        suppressBackupWarning: true,
        details: 'tokenBalances',
    });

    if (!accountInfo?.success) {
        throw new Error(`Get account balance info error: ${accountInfo.error.message}`);
    }

    return accountInfo.payload;
};

const getBalanceFromAccountInfo = ({
    accountInfo,
    symbol,
    contractId,
}: {
    accountInfo: AccountInfo;
    symbol: NetworkSymbol;
    contractId?: string;
}) => {
    const networkType = getNetworkType(symbol);

    const findTokenBalance = () => {
        const token = accountInfo.tokens?.find(t => t.contract === contractId);

        if (token && token.balance) {
            // this is raw value from getAccountInfo, we need to divide it by 10^decimals (in redux it's already formatted)
            return new BigNumber(token.balance).div(10 ** token.decimals).toFixed();
        }

        return '0';
    };

    switch (networkType) {
        case 'ripple':
            // On Ripple, if we use availableBalance, we will get higher balance, IDK why.
            return accountInfo.balance;
        case 'stellar':
            return contractId ? findTokenBalance() : accountInfo.balance;
        case 'ethereum':
        case 'solana':
        case 'cardano':
            return contractId ? findTokenBalance() : accountInfo.availableBalance;
        default:
            return accountInfo.availableBalance;
    }
};

const accountBalanceHistoryCache: Record<string, AccountBalanceHistoryWithTokens> = {};

const getAccountBalanceHistory = async ({
    accountItem,
    endOfTimeFrameDate,
    startOfTimeFrameDate,
    forceRefetch,
    // We pass dispatch because we need to fetch all transactions using redux thunk. This is a workaround for now to keep things simple.
    // In future we should convert this to proper thunk so we can use dispatch and selectors from thunkAPI.
    dispatch,
}: {
    accountItem: AccountItem;
    endOfTimeFrameDate: Date;
    startOfTimeFrameDate: Date | null;
    forceRefetch?: boolean;
    dispatch: ReturnType<typeof useDispatch>;
}): Promise<AccountBalanceHistoryWithTokens> => {
    const { symbol, identity, descriptor, accountKey, tokensFilter } = accountItem;
    const endTimeFrameTimestamp = getUnixTime(endOfTimeFrameDate);
    const startOfTimeFrameDateTimestamp = startOfTimeFrameDate
        ? (getUnixTime(startOfTimeFrameDate) as Timestamp)
        : null;
    const cacheKey = `${JSON.stringify(accountItem)}-${endTimeFrameTimestamp}-${startOfTimeFrameDateTimestamp}`;
    if (accountBalanceHistoryCache[cacheKey] && !forceRefetch) {
        return accountBalanceHistoryCache[cacheKey];
    }

    const getBalanceHistory = async () => {
        if (isIgnoredBalanceHistoryCoin(symbol)) {
            return {
                main: [],
                tokens: {},
            };
        }
        if (isLocalBalanceHistoryCoin(symbol)) {
            const allTransactions = await dispatch(
                fetchTransactionsFromNowUntilTimestamp({
                    accountKey,
                    timestamp: startOfTimeFrameDateTimestamp,
                }),
            ).unwrap();

            const movements = getAccountHistoryMovementFromTransactions({
                transactions: allTransactions,
                symbol,
            });

            tokensFilter?.forEach(tokenAddress => {
                // if there are no movements for this token, we need to add an empty array otherwise it will be skipped
                if (!movements.tokens[tokenAddress]) {
                    movements.tokens[tokenAddress] = [];
                }
            });

            return movements;
        }

        const connectBalanceHistory = await TrezorConnect.blockchainGetAccountBalanceHistory({
            coin: symbol,
            identity,
            descriptor,
            from: startOfTimeFrameDateTimestamp ?? undefined,
            to: endTimeFrameTimestamp,
            groupBy: 1,
            // we don't need currencies at all here, this will just reduce transferred data size
            currencies: ['usd'],
        });

        if (!connectBalanceHistory?.success) {
            throw new Error(
                `Get account balance movement error: ${connectBalanceHistory.error.message}`,
            );
        }

        return {
            main: connectBalanceHistory.payload.map(item => ({
                ...item,
                received: new BigNumber(item.received),
                sent: new BigNumber(item.sent),
                sentToSelf: new BigNumber(item.sentToSelf || 0),
            })),
            tokens: {},
        };
    };

    const [accountMovementHistory, latestAccountInfo] = await Promise.all([
        getBalanceHistory(),
        getLatestAccountInfo({ symbol, identity, descriptor }),
    ]);

    const accountMovementHistoryWithBalance = addBalanceForAccountMovementHistory(
        accountMovementHistory.main,
        symbol,
        getBalanceFromAccountInfo({ accountInfo: latestAccountInfo, symbol }),
    );

    const tokens: Array<readonly [TokenAddress, AccountHistoryMovementItem[]]> = pipe(
        latestAccountInfo.tokens ?? [],

        A.map(
            t =>
                [
                    t.contract as TokenAddress,
                    accountMovementHistory.tokens?.[t.contract as TokenAddress] ?? [],
                ] as const,
        ),
        A.filter(([contractId]) => !tokensFilter || tokensFilter.includes(contractId)),
        F.toMutable,
    );
    const tokensMovementHistoryWithBalance = D.mapWithKey(
        D.fromPairs(tokens),
        (contractId, tokenHistory) => {
            const latestBalance = getBalanceFromAccountInfo({
                accountInfo: latestAccountInfo,
                symbol,
                contractId: contractId.toString(),
            });
            const historyWithBalance = addBalanceForAccountMovementHistory(
                tokenHistory,
                symbol,
                latestBalance,
            );

            historyWithBalance.push({
                time: endTimeFrameTimestamp,
                cryptoBalance: latestBalance,
            });

            return historyWithBalance;
        },
    );

    // Last point must be balance from getAccountInfo because blockchainGetAccountBalanceHistory it's not always reliable for coins like ETH.
    // TODO: We can get value from redux account info instead of fetching it again which could cause minor inconsistency.
    accountMovementHistoryWithBalance.push({
        time: endTimeFrameTimestamp,
        cryptoBalance: formatNetworkAmount(
            getBalanceFromAccountInfo({ accountInfo: latestAccountInfo, symbol }),
            symbol,
        ),
    });

    const result: AccountBalanceHistoryWithTokens = {
        main: accountMovementHistoryWithBalance,
        tokens: tokensMovementHistoryWithBalance,
    };

    accountBalanceHistoryCache[cacheKey] = result;

    return result;
};

const fiatRatesCache: Record<string, FiatRatesItem[]> = {};

type GetFiatRatesForNetworkInTimeFrame = {
    timestamps: number[];
    symbol: NetworkSymbol;
    contractId?: TokenAddress;
    baseCurrencyCode: BaseCurrencyCode;
    forceRefetch?: boolean;
    isElectrumBackend: boolean;
};

export const getFiatRatesForNetworkInTimeFrame = async ({
    timestamps,
    symbol,
    contractId,
    baseCurrencyCode,
    forceRefetch,
    isElectrumBackend,
}: GetFiatRatesForNetworkInTimeFrame) => {
    const cacheKey = `${symbol}-${contractId}-${baseCurrencyCode}-${JSON.stringify(timestamps)}`;

    if (fiatRatesCache[cacheKey] && !forceRefetch) {
        return fiatRatesCache[cacheKey];
    }

    const fiatRates = await getFiatRatesForTimestamps(
        { symbol, tokenAddress: contractId },
        timestamps,
        baseCurrencyCode,
        isElectrumBackend,
    );
    if (G.isNullable(fiatRates)) return null;

    const formattedFiatRates = fiatRates.tickers.map((ticker, index) => ({
        time: timestamps[index],
        rates: ticker.rates,
    }));

    fiatRatesCache[cacheKey] = formattedFiatRates;

    return formattedFiatRates;
};

type GetMultipleAccountBalanceHistoryWithFiatParams = {
    accounts: AccountItem[];
    startOfTimeFrameDate: Date | null;
    endOfTimeFrameDate: Date;
    numberOfPoints?: number;
    baseCurrencyCode: BaseCurrencyCode;
    forceRefetch?: boolean;
    isElectrumBackend: boolean;
    dispatch: ReturnType<typeof useDispatch>;
};

export const getMultipleAccountBalanceHistoryWithFiat = async ({
    accounts,
    startOfTimeFrameDate,
    endOfTimeFrameDate,
    numberOfPoints = NUMBER_OF_POINTS,
    baseCurrencyCode,
    forceRefetch,
    isElectrumBackend,
    dispatch,
}: GetMultipleAccountBalanceHistoryWithFiatParams): Promise<
    FiatGraphPoint[] | FiatGraphPointWithCryptoBalance[]
> => {
    const accountsWithBalanceHistory = await Promise.all(
        accounts
            .filter(a => !isIgnoredBalanceHistoryCoin(a.symbol))
            .map(accountItem => {
                const { symbol } = accountItem;

                return getAccountBalanceHistory({
                    endOfTimeFrameDate,
                    startOfTimeFrameDate,
                    forceRefetch,
                    dispatch,
                    accountItem,
                })
                    .then(balanceHistory => ({
                        accountItem,
                        balanceHistory,
                    }))
                    .catch(error => {
                        console.error(
                            `Unable to fetch GRAPH balance history for ${symbol} account:`,
                            error,
                        );
                        error.message = `${symbol.toUpperCase()}: ${error.message}`;
                        throw error;
                    });
            }),
    );

    const accountsWithBalanceHistoryFlattened: AccountWithBalanceHistory[] = pipe(
        accountsWithBalanceHistory,
        A.map(
            ({
                accountItem: { symbol, descriptor, tokensFilter, hideMainAccount },
                balanceHistory,
            }) => {
                const main = hideMainAccount
                    ? []
                    : [{ symbol, descriptor, balanceHistory: balanceHistory.main }];

                const tokens = pipe(
                    balanceHistory.tokens,
                    D.filterWithKey(
                        (contractId, _) => !tokensFilter || tokensFilter.includes(contractId),
                    ),
                    D.mapWithKey((contractId, tokenBalanceHistory) => ({
                        symbol,
                        descriptor,
                        contractId,
                        balanceHistory: tokenBalanceHistory!,
                    })),
                    D.values,
                );

                return [...main, ...tokens];
            },
        ),
        A.flat,
        F.toMutable,
    );

    if (!startOfTimeFrameDate) {
        // if startOfTimeFrameDate is not provided, it means we want to show all available data
        // so we need to find the oldest date balance movement in all accounts
        startOfTimeFrameDate = pipe(
            accountsWithBalanceHistoryFlattened,
            findOldestBalanceMovementTimestamp,
            fromUnixTime,
        );

        // if there were no balance movements at all,
        // findOldestBalanceMovementTimestamp resulted with start date being the same as end date
        // use 1 year into past and return zeroes for the range
        if (startOfTimeFrameDate.getTime() === endOfTimeFrameDate.getTime()) {
            const startDate = startOfTimeFrameDate;
            startDate.setDate(startDate.getHours() - 8760);

            return [
                ...getTimestampsInTimeFrame(startDate, endOfTimeFrameDate, numberOfPoints - 1),
                getUnixTime(endOfTimeFrameDate),
            ].map(t => ({ date: fromUnixTime(t), value: 0 }));
        }
    }

    // Last timestamp must be endOfTimeFrameDate because blockchainGetAccountBalanceHistory it's not always reliable for coins like ETH.
    // So we manually add balance from getAccountInfo for last point in getAccountBalanceHistory.
    const timestamps = [
        ...getTimestampsInTimeFrame(startOfTimeFrameDate, endOfTimeFrameDate, numberOfPoints - 1),
        getUnixTime(endOfTimeFrameDate),
    ];

    type CoinKey = `${NetworkSymbol}-${TokenAddress}` | `${NetworkSymbol}-`;
    const getCoinKey = ({
        symbol,
        contractId,
    }: {
        symbol: NetworkSymbol;
        contractId?: TokenAddress;
    }): CoinKey => `${symbol}-${contractId ?? ''}`;

    // Using Set is faster than A.uniq because it's O(n) instead of O(n^2)
    const coinsSet = new Set<CoinKey>();
    accountsWithBalanceHistoryFlattened.forEach(({ symbol, contractId }) => {
        coinsSet.add(getCoinKey({ symbol, contractId }));
    });

    const coins = Array.from(coinsSet).map(coinKey => {
        const delimiterIndex = coinKey.indexOf('-');
        const symbol = coinKey.slice(0, delimiterIndex) as NetworkSymbol;
        const contractIdPart = coinKey.slice(delimiterIndex + 1);
        const contractId = (contractIdPart || undefined) as TokenAddress | undefined;

        return { symbol, contractId };
    });

    const pairs = await Promise.all(
        coins.map(({ symbol, contractId }) =>
            getFiatRatesForNetworkInTimeFrame({
                timestamps,
                symbol,
                contractId,
                baseCurrencyCode,
                forceRefetch,
                isElectrumBackend,
            })
                .then(res => {
                    if (res === null)
                        throw new Error(`Unable to fetch fiat rates for defined timestamps.`);

                    return [getCoinKey({ symbol, contractId }), res] as const;
                })
                .catch(error => {
                    console.error(
                        `Unable to fetch GRAPH fiat rates ${baseCurrencyCode} for ${symbol} ${contractId}:`,
                        error,
                    );
                    error.message = `${symbol.toUpperCase()} (${baseCurrencyCode}): ${error.message}`;
                    if (contractId) {
                        error.message = `${error.message} - ${contractId}`;
                    }
                    throw error;
                }),
        ),
    );

    const coinsFiatRates: Record<CoinKey, FiatRatesItem[]> = D.fromPairs(
        // Some coins might not have fiat rates, so we need to filter them out
        pairs.filter(([, res]) => res?.[0]?.rates?.[baseCurrencyCode] !== -1),
    );

    if (A.length(accountsWithBalanceHistoryFlattened) === 1) {
        // If there is only one account, we don't need to merge anything.
        // We can also keep cryptoBalance in points.
        const { symbol, contractId, balanceHistory } = A.head(accountsWithBalanceHistoryFlattened)!;
        const coinKey = getCoinKey({ symbol, contractId });

        return mapCryptoBalanceMovementToFixedTimeFrame({
            fiatRates: coinsFiatRates[coinKey],
            baseCurrencyCode,
            balanceHistory,
        }) as FiatGraphPointWithCryptoBalance[];
    }

    const accountsWithFiatBalanceHistory = A.filterMap(
        accountsWithBalanceHistoryFlattened,
        ({ symbol, contractId, balanceHistory }) => {
            const coinKey = getCoinKey({ symbol, contractId });

            const coinFiatRates = coinsFiatRates?.[coinKey];

            if (!coinFiatRates) {
                return O.None;
            }

            const m = mapCryptoBalanceMovementToFixedTimeFrame({
                fiatRates: coinFiatRates,
                baseCurrencyCode,
                balanceHistory,
            });

            return O.Some(m);
        },
    );

    const mergedHistories = mergeMultipleFiatBalanceHistories(
        accountsWithFiatBalanceHistory,
    ) as FiatGraphPoint[];

    return mergedHistories;
};
