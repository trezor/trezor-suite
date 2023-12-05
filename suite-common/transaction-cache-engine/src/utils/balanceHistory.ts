import BigNumber from 'bignumber.js';

import { AccountTransaction } from '@trezor/connect';
import { NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';

import { AccountBalanceHistory } from '../types';

const getAccountBalanceHistoryBTC = ({
    transactions,
}: {
    transactions: AccountTransaction[];
}): AccountBalanceHistory[] => {
    const summaryMap = new Map<number, AccountBalanceHistory>();

    transactions.forEach(tx => {
        let ownInputIndex: number = -1;
        let sentSat = new BigNumber(0);
        let sentToSelfSat = new BigNumber(0);
        let receivedSat = new BigNumber(0);
        let countSentToSelf = false;
        const { blockTime } = tx;

        if (!blockTime) {
            return;
        }

        for (let i = 0; i < tx.details.vin.length; i++) {
            const tai = tx.details.vin[i];
            if (tai?.isOwn && tai.value) {
                const taiValue = new BigNumber(tai.value);
                if (ownInputIndex < 0) {
                    ownInputIndex = i;
                }

                sentSat = sentSat.plus(taiValue);
                if (ownInputIndex === i) {
                    countSentToSelf = true;
                }
            }
        }

        for (let i = 0; i < tx.details.vout.length; i++) {
            const tao = tx.details.vout[i];
            if (tao?.isOwn && tao.value) {
                const taoValue = new BigNumber(tao.value);
                receivedSat = receivedSat.plus(taoValue);

                if (countSentToSelf) {
                    sentToSelfSat = sentToSelfSat.plus(taoValue);
                }
            }
        }

        if (summaryMap.has(blockTime)) {
            const summary = summaryMap.get(blockTime)!;
            summary.txs += 1;
            summary.received = summary.received.plus(receivedSat);
            summary.sent = summary.sent.plus(sentSat);
            summary.sentToSelf = summary.sentToSelf.plus(sentToSelfSat);
        } else {
            summaryMap.set(blockTime, {
                time: blockTime,
                txs: 1,
                received: receivedSat,
                sent: sentSat,
                sentToSelf: sentToSelfSat,
            });
        }
    });

    return Array.from(summaryMap.values()).sort((a, b) => a.time - b.time);
};

const getAccountBalanceHistoryRipple = ({
    transactions,
}: {
    transactions: AccountTransaction[];
}): AccountBalanceHistory[] => {
    const summaryMap = new Map<number, AccountBalanceHistory>();

    transactions.forEach(tx => {
        const { blockTime } = tx;
        let sentDrops = new BigNumber(0);
        let receivedDrops = new BigNumber(0);

        if (!blockTime) {
            return;
        }

        const amount = new BigNumber(tx.amount);

        if (tx.type === 'sent') {
            sentDrops = amount;
        } else if (tx.type === 'recv') {
            receivedDrops = amount;
        }

        if (summaryMap.has(blockTime)) {
            const summary = summaryMap.get(blockTime)!;
            summary.txs += 1;
            summary.received = amount.plus(receivedDrops);
            summary.sent = amount.plus(sentDrops);
        } else {
            summaryMap.set(blockTime, {
                time: blockTime,
                txs: 1,
                received: receivedDrops,
                sent: sentDrops,
                sentToSelf: new BigNumber(0),
            });
        }
    });

    return Array.from(summaryMap.values()).sort((a, b) => a.time - b.time);
};

export const getAccountBalanceHistory = ({
    transactions,
    coin,
}: {
    transactions: AccountTransaction[];
    coin: NetworkSymbol;
}): AccountBalanceHistory[] => {
    const networkType = getNetworkType(coin);
    switch (networkType) {
        case 'bitcoin':
            return getAccountBalanceHistoryBTC({ transactions });
        case 'ripple':
            return getAccountBalanceHistoryRipple({ transactions });
        default:
            throw new Error(`getAccountBalanceHistory: Unsupported network ${coin}`);
    }
};
