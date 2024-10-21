import { TokenAddress, WalletAccountTransaction } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { LocalBalanceHistoryCoin } from './constants';
import { AccountHistoryMovement, AccountHistoryMovementItem } from './types';

/*
Logic for calculating account history movement (BTC + ETH) from transactions is nearly identical as we use on blockbook
https://github.com/trezor/blockbook/blob/0afcb3a002e9f818907f2e1398f5c2af72c9f1ae/api/worker.go#L1470
*/

type BlockTime = number;

type GetAccountHistoryMovementItemParams = {
    transactions: WalletAccountTransaction[];
    from?: number;
    to?: number;
};

const getAccountHistoryMovementItemBTC = ({
    transactions,
    from,
    to,
}: GetAccountHistoryMovementItemParams): AccountHistoryMovement => {
    const summaryMap = new Map<BlockTime, AccountHistoryMovementItem>();

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

        if ((from && blockTime < from) || (to && blockTime > to)) {
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

    return { main: Array.from(summaryMap.values()).sort((a, b) => a.time - b.time), tokens: {} };
};

const getAccountHistoryMovementItemRipple = ({
    transactions,
    from,
    to,
}: GetAccountHistoryMovementItemParams): AccountHistoryMovement => {
    const summaryMap = new Map<BlockTime, AccountHistoryMovementItem>();

    transactions.forEach(tx => {
        const { blockTime } = tx;
        let sentDrops = new BigNumber(0);
        let receivedDrops = new BigNumber(0);

        if (!blockTime) {
            return;
        }

        if ((from && blockTime < from) || (to && blockTime > to)) {
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
            summary.received = summary.received.plus(receivedDrops);
            summary.sent = summary.sent.plus(sentDrops);
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

    return { main: Array.from(summaryMap.values()).sort((a, b) => a.time - b.time), tokens: {} };
};

// this can be also used for networks of Ethereum type (like ETH, POL or BNB)
export const getAccountHistoryMovementItemETH = ({
    transactions,
    from,
    to,
}: GetAccountHistoryMovementItemParams): AccountHistoryMovement => {
    const summaryMap = new Map<BlockTime, AccountHistoryMovementItem>();
    const allTokensSummaryMap = new Map<TokenAddress, typeof summaryMap>();

    transactions.forEach(tx => {
        const { blockTime } = tx;

        if (!blockTime || tx.ethereumSpecific === undefined) {
            return;
        }

        if ((from && blockTime < from) || (to && blockTime > to)) {
            return;
        }

        const bh: AccountHistoryMovementItem = {
            time: blockTime,
            txs: 1,
            received: new BigNumber(0),
            sent: new BigNumber(0),
            sentToSelf: new BigNumber(0),
        };

        let countSentToSelf = false;
        const ethTxData = tx.ethereumSpecific;

        if (
            ethTxData.status === 1 /* TxStatusOK */ ||
            ethTxData.status === 0 /* TxStatusUnknown */
        ) {
            if (tx.details.vout.length > 0) {
                const bchainVout = tx.details.vout[0];
                const value = new BigNumber(bchainVout.value || '0');

                if (bchainVout.addresses && bchainVout.addresses.length > 0) {
                    const txAddrDesc = bchainVout.addresses[0];

                    if (tx.descriptor === txAddrDesc) {
                        // Check if address is in selfAddrDesc
                        bh.received = bh.received.plus(value);
                    }

                    if (tx.descriptor === txAddrDesc) {
                        countSentToSelf = true;
                    }
                }
            }

            if (ethTxData.internalTransfers) {
                for (const f of ethTxData.internalTransfers) {
                    const fromAddrDesc = f.from;
                    const toAddrDesc = f.to;

                    if (fromAddrDesc === tx.descriptor) {
                        bh.sent = bh.sent.plus(new BigNumber(f.value));

                        if (f.from === f.to) {
                            bh.sentToSelf = bh.sentToSelf.plus(new BigNumber(f.value));
                        }
                    }

                    if (toAddrDesc === tx.descriptor) {
                        bh.received = bh.received.plus(new BigNumber(f.value));
                    }
                }
            }
        }

        for (const bchainVin of tx.details.vin) {
            if (bchainVin.addresses && bchainVin.addresses.length > 0) {
                const txAddrDesc = bchainVin.addresses[0];

                if (txAddrDesc === tx.descriptor) {
                    if (ethTxData.status === 1 || ethTxData.status === 0) {
                        const value = new BigNumber(tx.details.vout[0]?.value || '0');
                        bh.sent = bh.sent.plus(value);

                        if (countSentToSelf && txAddrDesc === tx.descriptor) {
                            bh.sentToSelf = bh.sentToSelf.plus(value);
                        }
                    }

                    let feesSat = new BigNumber(0);
                    if (ethTxData.gasUsed !== undefined && ethTxData.gasPrice !== undefined) {
                        feesSat = new BigNumber(ethTxData.gasPrice).times(ethTxData.gasUsed);
                    }
                    bh.sent = bh.sent.plus(feesSat);
                }
            }
        }

        tx.tokens.forEach(token => {
            // skip empty amounts and non-ERC20 non-BEP20 tokens
            // BEP20 is BNB Smart Chain (BSC) token standard
            if (token.amount === '' || (token.standard !== 'ERC20' && token.standard !== 'BEP20'))
                return;

            if (token.type === 'sent' || token.type === 'recv' || token.type === 'self') {
                const tokenSummary: AccountHistoryMovementItem = {
                    time: blockTime,
                    txs: 1,
                    received: new BigNumber(0),
                    sent: new BigNumber(0),
                    sentToSelf: new BigNumber(0),
                };

                const amount = new BigNumber(token.amount).div(10 ** token.decimals);

                if (token.type === 'sent') {
                    tokenSummary.sent = tokenSummary.sent.plus(amount);
                } else if (token.type === 'recv') {
                    tokenSummary.received = tokenSummary.received.plus(amount);
                } else if (token.type === 'self') {
                    tokenSummary.sentToSelf = tokenSummary.sentToSelf.plus(amount);
                }

                const tokenContractId = token.contract as TokenAddress;

                if (!allTokensSummaryMap.has(tokenContractId)) {
                    allTokensSummaryMap.set(tokenContractId, new Map());
                }

                const tokenSummaryMap = allTokensSummaryMap.get(tokenContractId)!;
                const existingBlockSummary = tokenSummaryMap.get(blockTime);

                if (existingBlockSummary) {
                    existingBlockSummary.txs += 1;
                    existingBlockSummary.received = existingBlockSummary.received.plus(
                        tokenSummary.received,
                    );
                    existingBlockSummary.sent = existingBlockSummary.sent.plus(tokenSummary.sent);
                    existingBlockSummary.sentToSelf = existingBlockSummary.sentToSelf.plus(
                        tokenSummary.sentToSelf,
                    );
                } else {
                    tokenSummaryMap.set(blockTime, tokenSummary);
                }
            }
        });

        if (summaryMap.has(blockTime)) {
            const summary = summaryMap.get(blockTime)!;
            summary.txs += 1;
            summary.received = summary.received.plus(bh.received);
            summary.sent = summary.sent.plus(bh.sent);
            summary.sentToSelf = summary.sentToSelf.plus(bh.sentToSelf);
        } else {
            summaryMap.set(blockTime, bh);
        }
    });

    const sortedTokensSummaries: Record<TokenAddress, AccountHistoryMovementItem[]> = {};
    for (const [contract, tokenSummaryMap] of allTokensSummaryMap.entries()) {
        const sortedTokenSummaries = Array.from(tokenSummaryMap.values()).sort(
            (a, b) => a.time - b.time,
        );
        sortedTokensSummaries[contract] = sortedTokenSummaries;
    }
    const sortedSummaries = Array.from(summaryMap.values()).sort((a, b) => a.time - b.time);

    return {
        main: sortedSummaries,
        tokens: sortedTokensSummaries,
    };
};

export const getAccountHistoryMovementFromTransactions = ({
    transactions,
    coin,
    from,
    to,
}: {
    transactions: WalletAccountTransaction[];
    // We need to revaluate if we want to calculate BTC history from transactions or use blockbook
    coin: LocalBalanceHistoryCoin | 'btc';
    from?: number;
    to?: number;
}): AccountHistoryMovement => {
    switch (coin) {
        case 'btc':
            return getAccountHistoryMovementItemBTC({ transactions, from, to });
        case 'xrp':
            return getAccountHistoryMovementItemRipple({ transactions, from, to });
        case 'eth':
        case 'pol':
        case 'bnb':
            return getAccountHistoryMovementItemETH({ transactions, from, to });
        case 'sol':
            return {
                main: [] as AccountHistoryMovementItem[],
                tokens: {},
            } as AccountHistoryMovement;
        default:
            coin satisfies never;
            throw new Error(`getAccountHistoryMovementItem: Unsupported network ${coin}`);
    }
};
