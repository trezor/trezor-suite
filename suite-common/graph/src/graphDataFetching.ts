import { useDispatch } from 'react-redux';

import { A, D, F, G, pipe } from '@mobily/ts-belt';
import { fromUnixTime, getUnixTime } from 'date-fns';

import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { AccountBalanceHistory as AccountMovementHistory } from '@trezor/blockchain-link';
import TrezorConnect, { AccountInfo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { fetchAllTransactionsForAccountThunk } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';

import { NUMBER_OF_POINTS } from './constants';
import {
    findOldestBalanceMovementTimestamp,
    getTimestampsInTimeFrame,
    mapCryptoBalanceMovementToFixedTimeFrame,
    mergeMultipleFiatBalanceHistories,
} from './graphUtils';
import {
    AccountBalanceHistoryWithTokens,
    AccountHistoryBalancePoint,
    AccountHistoryMovementItem,
    AccountItem,
    AccountWithBalanceHistory,
    FiatGraphPoint,
    FiatGraphPointWithCryptoBalance,
} from './types';
import { getAccountHistoryMovementFromTransactions } from './balanceHistoryUtils';

export const addBalanceForAccountMovementHistory = (
    data: AccountMovementHistory[] | AccountHistoryMovementItem[],
    symbol: NetworkSymbol,
): AccountHistoryBalancePoint[] => {
    let balance = new BigNumber('0');
    const historyWithBalance = data.map(dataPoint => {
        // subtract sentToSelf field as we don't want to include amounts received/sent to the same account
        const normalizedReceived = dataPoint.sentToSelf
            ? new BigNumber(dataPoint.received).minus(dataPoint.sentToSelf || 0)
            : dataPoint.received;
        const normalizedSent = dataPoint.sentToSelf
            ? new BigNumber(dataPoint.sent).minus(dataPoint.sentToSelf || 0)
            : dataPoint.sent;

        balance = new BigNumber(balance).plus(normalizedReceived).minus(normalizedSent);

        return {
            time: dataPoint.time,
            cryptoBalance: formatNetworkAmount(balance.toFixed(), symbol),
        };
    });

    return historyWithBalance;
};

const getLatestAccountInfo = async ({
    coin,
    identity,
    descriptor,
}: {
    coin: NetworkSymbol;
    identity?: string;
    descriptor: string;
}) => {
    const accountInfo = await TrezorConnect.getAccountInfo({
        coin,
        identity,
        descriptor,
        suppressBackupWarning: true,
        details: 'tokenBalances',
    });

    if (!accountInfo?.success) {
        throw new Error(`Get account balance info error: ${accountInfo.payload.error}`);
    }

    return accountInfo.payload;
};

const getBalanceFromAccountInfo = ({
    accountInfo,
    coin,
    contractId,
}: {
    accountInfo: AccountInfo;
    coin: NetworkSymbol;
    contractId?: string;
}) => {
    const networkType = getNetworkType(coin);

    switch (networkType) {
        case 'ripple':
            // On Ripple, if we use availableBalance, we will get higher balance, IDK why.
            return accountInfo.balance;
        case 'ethereum':
            if (contractId) {
                const token = accountInfo.tokens?.find(t => t.contract === contractId);

                return token?.balance || '0';
            }

            return accountInfo.availableBalance;
        default:
            return accountInfo.availableBalance;
    }
};

const accountBalanceHistoryCache: Record<string, AccountBalanceHistoryWithTokens> = {};

const getAccountBalanceHistory = async ({
    coin,
    identity,
    descriptor,
    endOfTimeFrameDate,
    forceRefetch,
    dispatch,
    accountKey,
}: {
    coin: NetworkSymbol;
    identity?: string;
    descriptor: string;
    endOfTimeFrameDate: Date;
    forceRefetch?: boolean;
    dispatch: ReturnType<typeof useDispatch>;
    accountKey: AccountKey;
}): Promise<AccountBalanceHistoryWithTokens> => {
    const endTimeFrameTimestamp = getUnixTime(endOfTimeFrameDate);
    const cacheKey = `${coin}-${descriptor}-${endTimeFrameTimestamp}-${identity}`;

    if (accountBalanceHistoryCache[cacheKey] && !forceRefetch) {
        return accountBalanceHistoryCache[cacheKey];
    }

    const getBalanceHistory = async () => {
        const networkType = getNetworkType(coin);
        if (networkType === 'ripple' || networkType === 'ethereum') {
            const allTransactions = await dispatch(
                fetchAllTransactionsForAccountThunk({
                    accountKey,
                }),
            ).unwrap();

            return getAccountHistoryMovementFromTransactions({
                transactions: allTransactions,
                coin,
            });
        }

        const connectBalanceHistory = await TrezorConnect.blockchainGetAccountBalanceHistory({
            coin,
            identity,
            descriptor,
            to: endTimeFrameTimestamp,
            groupBy: 1,
            // we don't need currencies at all here, this will just reduce transferred data size
            // TODO: doesn't work at all, fix it in connect or blockchain-link?
            // issue: https://github.com/trezor/trezor-suite/issues/8888
            currencies: ['usd'],
        });

        if (!connectBalanceHistory?.success) {
            throw new Error(
                `Get account balance movement error: ${connectBalanceHistory.payload.error}`,
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
        getLatestAccountInfo({ coin, identity, descriptor }),
    ]);

    const accountMovementHistoryWithBalance = addBalanceForAccountMovementHistory(
        accountMovementHistory.main,
        coin,
    );

    const tokensMovementHistoryWithBalance = D.mapWithKey(
        accountMovementHistory.tokens,
        (contractId, tokenHistory) => {
            const historyWithBalance = addBalanceForAccountMovementHistory(tokenHistory, coin);
            historyWithBalance.push({
                time: endTimeFrameTimestamp,
                cryptoBalance: formatNetworkAmount(
                    getBalanceFromAccountInfo({
                        accountInfo: latestAccountInfo,
                        coin,
                        contractId: contractId.toString(),
                    }),
                    coin,
                ),
            });

            return historyWithBalance;
        },
    );

    // Last point must be balance from getAccountInfo because blockchainGetAccountBalanceHistory it's not always reliable for coins like ETH.
    // TODO: We can get value from redux account info instead of fetching it again which could cause minor inconsistency.
    accountMovementHistoryWithBalance.push({
        time: endTimeFrameTimestamp,
        cryptoBalance: formatNetworkAmount(
            getBalanceFromAccountInfo({ accountInfo: latestAccountInfo, coin }),
            coin,
        ),
    });

    const result: AccountBalanceHistoryWithTokens = {
        main: accountMovementHistoryWithBalance,
        tokens: tokensMovementHistoryWithBalance,
    };

    accountBalanceHistoryCache[cacheKey] = result;

    return result;
};

type FiatRatesItem = {
    time: number;
    rates: {
        [key: string]: number | undefined;
    };
};

const fiatRatesCache: Record<string, FiatRatesItem[]> = {};

export const getFiatRatesForNetworkInTimeFrame = async ({
    timestamps,
    coin,
    contractId,
    fiatCurrency,
    forceRefetch,
    isElectrumBackend,
}: {
    timestamps: number[];
    coin: NetworkSymbol;
    contractId?: TokenAddress;
    fiatCurrency: FiatCurrencyCode;
    forceRefetch?: boolean;
    isElectrumBackend: boolean;
}) => {
    const cacheKey = `${coin}-${contractId}-${fiatCurrency}-${JSON.stringify(timestamps)}`;

    if (fiatRatesCache[cacheKey] && !forceRefetch) {
        return fiatRatesCache[cacheKey];
    }

    const fiatRates = await getFiatRatesForTimestamps(
        { symbol: coin, tokenAddress: contractId },
        timestamps,
        fiatCurrency,
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

export const getMultipleAccountBalanceHistoryWithFiat = async ({
    accounts,
    startOfTimeFrameDate,
    endOfTimeFrameDate,
    numberOfPoints = NUMBER_OF_POINTS,
    fiatCurrency,
    forceRefetch,
    isElectrumBackend,
    dispatch,
}: {
    accounts: AccountItem[];
    startOfTimeFrameDate: Date | null;
    endOfTimeFrameDate: Date;
    numberOfPoints?: number;
    fiatCurrency: FiatCurrencyCode;
    forceRefetch?: boolean;
    isElectrumBackend: boolean;
    dispatch: ReturnType<typeof useDispatch>;
}): Promise<FiatGraphPoint[] | FiatGraphPointWithCryptoBalance[]> => {
    const accountsWithBalanceHistory = await Promise.all(
        accounts.map(({ coin, descriptor, identity, accountKey }) =>
            getAccountBalanceHistory({
                coin,
                descriptor,
                identity,
                endOfTimeFrameDate,
                forceRefetch,
                dispatch,
                accountKey,
            })
                .then(balanceHistory => ({
                    coin,
                    descriptor,
                    balanceHistory,
                }))
                .catch(error => {
                    console.error(
                        `Unable to fetch GRAPH balance history for ${coin} account:`,
                        error,
                    );
                    error.message = `${coin.toUpperCase()}: ${error.message}`;
                    throw error;
                }),
        ),
    );

    const accountsWithBalanceHistoryFlattened: AccountWithBalanceHistory[] = pipe(
        accountsWithBalanceHistory,
        A.map(({ coin, descriptor, balanceHistory }) => {
            const main = [{ coin, descriptor, balanceHistory: balanceHistory.main }];
            const tokens = pipe(
                balanceHistory.tokens,
                D.mapWithKey((contractId, tokenBalanceHistory) => {
                    return { coin, descriptor, contractId, balanceHistory: tokenBalanceHistory };
                }),
                D.values,
            );

            return [...main, ...tokens];
        }),
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
    }

    // Last timestamp must be endOfTimeFrameDate because blockchainGetAccountBalanceHistory it's not always reliable for coins like ETH.
    // So we manually add balance from getAccountInfo for last point in getAccountBalanceHistory.
    const timestamps = [
        ...getTimestampsInTimeFrame(startOfTimeFrameDate, endOfTimeFrameDate, numberOfPoints - 1),
        getUnixTime(endOfTimeFrameDate),
    ];

    type CoinKey = `${NetworkSymbol}-${TokenAddress}` | `${NetworkSymbol}-`;
    const getCoinKey = ({
        coin,
        contractId,
    }: {
        coin: NetworkSymbol;
        contractId?: TokenAddress;
    }): CoinKey => `${coin}-${contractId ?? ''}`;

    const coins = pipe(
        accountsWithBalanceHistoryFlattened,
        A.map(({ coin, contractId }) => ({ coin, contractId })),
        A.uniqBy(getCoinKey),
    );

    const coinsFiatRates: Record<CoinKey, FiatRatesItem[]> = D.fromPairs(
        await Promise.all(
            coins.map(({ coin, contractId }) =>
                getFiatRatesForNetworkInTimeFrame({
                    timestamps,
                    coin,
                    contractId,
                    fiatCurrency,
                    forceRefetch,
                    isElectrumBackend,
                })
                    .then(res => {
                        if (res === null)
                            throw new Error(`Unable to fetch fiat rates for defined timestamps.`);

                        return [getCoinKey({ coin, contractId }), res] as const;
                    })
                    .catch(error => {
                        console.error(
                            `Unable to fetch GRAPH fiat rates ${fiatCurrency} for ${coin} ${contractId}:`,
                            error,
                        );
                        error.message = `${coin.toUpperCase()} (${fiatCurrency}): ${error.message}`;
                        if (contractId) {
                            error.message = `${error.message} - ${contractId}`;
                        }
                        throw error;
                    }),
            ),
        ),
    );

    if (A.length(accountsWithBalanceHistoryFlattened) === 1) {
        // If there is only one account, we don't need to merge anything.
        // We can also keep cryptoBalance in points.
        const { coin, contractId, balanceHistory } = A.head(accountsWithBalanceHistoryFlattened)!;
        const coinKey = getCoinKey({ coin, contractId });

        return mapCryptoBalanceMovementToFixedTimeFrame({
            fiatRates: coinsFiatRates[coinKey],
            fiatCurrency,
            balanceHistory,
        }) as FiatGraphPointWithCryptoBalance[];
    }

    const accountsWithFiatBalanceHistory = A.map(
        accountsWithBalanceHistoryFlattened,
        ({ coin, contractId, balanceHistory }) => {
            const coinKey = getCoinKey({ coin, contractId });

            const coinFiatRates = coinsFiatRates[coinKey];

            return mapCryptoBalanceMovementToFixedTimeFrame({
                fiatRates: coinFiatRates,
                fiatCurrency,
                balanceHistory,
            });
        },
    );

    return mergeMultipleFiatBalanceHistories(accountsWithFiatBalanceHistory) as FiatGraphPoint[];
};
