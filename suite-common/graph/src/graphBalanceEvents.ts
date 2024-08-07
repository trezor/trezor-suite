import { useDispatch } from 'react-redux';

import { A, pipe } from '@mobily/ts-belt';
import { fromUnixTime, getUnixTime } from 'date-fns';

import { NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import TrezorConnect from '@trezor/connect';
import { AccountBalanceHistory as AccountMovementHistory } from '@trezor/blockchain-link';
import { fetchAllTransactionsForAccountThunk } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';

import {
    BalanceMovementEvent,
    GroupedBalanceMovementEvent,
    AccountItem,
    AccountHistoryMovementItem,
} from './types';
import { getAccountHistoryMovementFromTransactions } from './balanceHistoryUtils';

/**
 * Calculates received and sent values of each balance movement point.
 */
export const formatBalanceMovementEventsAmounts = (
    balanceMovements: Array<AccountMovementHistory | AccountHistoryMovementItem>,
): readonly BalanceMovementEvent[] =>
    A.map(balanceMovements, balanceMovement => {
        const sentTotal = Number(balanceMovement.sent);
        const receivedTotal = Number(balanceMovement.received);

        const sentToSelf = Number.isNaN(Number(balanceMovement.sentToSelf))
            ? 0
            : Number(balanceMovement.sentToSelf);

        return {
            date: balanceMovement.time,
            payload: {
                sent: Math.abs(sentTotal - sentToSelf),
                received: Math.abs(receivedTotal - sentToSelf),
            },
        } as BalanceMovementEvent;
    });

/**
 * Groups adjacent balance movements together.
 *
 * @param groupingThreshold maximum distance of the balance movements to be grouped together.
 */
export const groupBalanceMovementEvents = (
    balanceMovements: readonly BalanceMovementEvent[],
    groupingThreshold: number,
) => {
    const groups: BalanceMovementEvent[][] = [];
    let currentGroup: BalanceMovementEvent[] = [];
    balanceMovements.forEach(balanceMovement => {
        if (
            A.isEmpty(currentGroup) ||
            balanceMovement.date - currentGroup[currentGroup.length - 1].date < groupingThreshold
        ) {
            currentGroup.push(balanceMovement);

            return;
        }
        groups.push(currentGroup);
        currentGroup = [balanceMovement];
    });

    if (A.isNotEmpty(currentGroup)) groups.push(currentGroup);

    return groups;
};

/**
 * Reduces each balance movements group to a single balance movement point.
 */
export const mergeGroups = ({
    groups,
    networkSymbol,
    tokenAddress,
    accountKey,
}: {
    groups: BalanceMovementEvent[][];
    networkSymbol: NetworkSymbol;
    accountKey: AccountKey;
    tokenAddress?: TokenAddress;
}) =>
    A.map(groups, group => {
        const averageTimestamp =
            group.reduce((sum, nextBalanceObject) => sum + nextBalanceObject.date, 0) /
            group.length;

        return {
            date: fromUnixTime(averageTimestamp),
            payload: group.reduce(
                (groupedBalanceMovementEvent, nextBalanceMovementEvent) => {
                    if (nextBalanceMovementEvent.payload.sent !== 0) {
                        groupedBalanceMovementEvent.sent += nextBalanceMovementEvent.payload.sent;
                        groupedBalanceMovementEvent.sentTransactionsCount += 1;
                    }

                    if (nextBalanceMovementEvent.payload.received !== 0) {
                        groupedBalanceMovementEvent.received +=
                            nextBalanceMovementEvent.payload.received;
                        groupedBalanceMovementEvent.receivedTransactionsCount += 1;
                    }

                    return groupedBalanceMovementEvent;
                },
                {
                    received: 0,
                    sent: 0,
                    sentTransactionsCount: 0,
                    receivedTransactionsCount: 0,
                    networkSymbol,
                    tokenAddress,
                    accountKey,
                },
            ),
        } as GroupedBalanceMovementEvent;
    });

/**  Relative number that ensure that there is no more than 30 points in each graph.  */
const GROUPING_DIVISOR = 30000;

export const getAccountMovementEvents = async ({
    account,
    startOfTimeFrameDate,
    endOfTimeFrameDate,
    dispatch,
}: {
    account: AccountItem;
    startOfTimeFrameDate: Date | null;
    endOfTimeFrameDate: Date;
    dispatch: ReturnType<typeof useDispatch>;
}) => {
    const { coin, identity, descriptor, tokensFilter, accountKey } = account;
    const tokenAddress = tokensFilter?.[0]; // This is only for graph on detail screen where we have always only one token

    const getBalanceHistory = async () => {
        const networkType = getNetworkType(coin);
        if (networkType === 'ethereum' || networkType === 'ripple') {
            const allTransactions = await dispatch(
                fetchAllTransactionsForAccountThunk({
                    accountKey: account.accountKey,
                }),
            ).unwrap();

            const movements = getAccountHistoryMovementFromTransactions({
                transactions: allTransactions,
                coin,
            });

            if (tokenAddress) {
                return movements.tokens[tokenAddress] ?? [];
            }

            return movements.main;
        }
        const connectBalanceHistory = await TrezorConnect.blockchainGetAccountBalanceHistory({
            coin,
            identity,
            descriptor,
            from: startOfTimeFrameDate ? getUnixTime(startOfTimeFrameDate) : undefined,
            to: getUnixTime(endOfTimeFrameDate),
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

        return connectBalanceHistory.payload;
    };

    const accountHistoryMovements = await getBalanceHistory();

    /** Determines relative maximum distance of adjacent balance movements to be grouped together. */
    const GROUPING_THRESHOLD =
        (endOfTimeFrameDate.getTime() -
            (startOfTimeFrameDate?.getTime() ?? accountHistoryMovements[0].time * 1000)) /
        GROUPING_DIVISOR;

    return pipe(
        accountHistoryMovements,
        formatBalanceMovementEventsAmounts,
        formattedBalances => groupBalanceMovementEvents(formattedBalances, GROUPING_THRESHOLD),
        groups => mergeGroups({ groups, networkSymbol: coin, tokenAddress, accountKey }),
    ) as GroupedBalanceMovementEvent[];
};
