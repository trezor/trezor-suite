import { A, pipe } from '@mobily/ts-belt';
import { fromUnixTime, getUnixTime } from 'date-fns';

import { NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import TrezorConnect from '@trezor/connect';
import { AccountBalanceHistory as AccountMovementHistory } from '@trezor/blockchain-link';
import {
    AccountBalanceHistory,
    TransactionCacheEngine,
} from '@suite-common/transaction-cache-engine';

import { BalanceMovementEvent, GroupedBalanceMovementEvent, AccountItem } from './types';

/**
 * Calculates received and sent values of each balance movement point.
 */
export const formatBalanceMovementEventsAmounts = (
    balanceMovements: Array<AccountMovementHistory | AccountBalanceHistory>,
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
export const mergeGroups = (groups: BalanceMovementEvent[][], networkSymbol: NetworkSymbol) =>
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
}: {
    account: AccountItem;
    startOfTimeFrameDate: Date | null;
    endOfTimeFrameDate: Date;
}) => {
    const { coin, descriptor } = account;

    const getBalanceHistory = async () => {
        if (getNetworkType(coin) === 'ripple') {
            return TransactionCacheEngine.getAccountBalanceHistory({
                coin,
                descriptor,
            });
        }
        const connectBalanceHistory = await TrezorConnect.blockchainGetAccountBalanceHistory({
            coin,
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
        group => mergeGroups(group, coin),
    ) as GroupedBalanceMovementEvent[];
};
