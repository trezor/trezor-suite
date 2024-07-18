import { BigNumber } from '@trezor/utils/src/bigNumber';
import { NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { TokenAddress, WalletAccountTransaction } from '@suite-common/wallet-types';

import { AccountHistoryMovement, AccountHistoryMovementItem } from './types';

type BlockTime = number;

const getAccountHistoryMovementItemBTC = ({
    transactions,
}: {
    transactions: WalletAccountTransaction[];
}): AccountHistoryMovement => {
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
}: {
    transactions: WalletAccountTransaction[];
}): AccountHistoryMovement => {
    const summaryMap = new Map<BlockTime, AccountHistoryMovementItem>();

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

export const getAccountHistoryMovementItemETH = ({
    transactions,
}: {
    transactions: WalletAccountTransaction[];
}): AccountHistoryMovement => {
    const summaryMap = new Map<BlockTime, AccountHistoryMovementItem>();
    const allTokensSummaryMap = new Map<TokenAddress, typeof summaryMap>();

    transactions.forEach(tx => {
        const { blockTime } = tx;

        if (!blockTime || tx.ethereumSpecific === undefined) {
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
            // skip empty amounts and non-ERC20 tokens
            if (token.amount === '' || token.standard !== 'ERC20') return;

            if (token.type === 'sent' || token.type === 'recv' || token.type === 'self') {
                const tokenSummary: AccountHistoryMovementItem = {
                    time: blockTime,
                    txs: 1,
                    received: new BigNumber(0),
                    sent: new BigNumber(0),
                    sentToSelf: new BigNumber(0),
                };

                if (token.type === 'sent') {
                    tokenSummary.sent = tokenSummary.sent.plus(token.amount);
                } else if (token.type === 'recv') {
                    tokenSummary.received = tokenSummary.received.plus(token.amount);
                } else if (token.type === 'self') {
                    tokenSummary.sentToSelf = tokenSummary.sentToSelf.plus(token.amount);
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
}: {
    transactions: WalletAccountTransaction[];
    coin: NetworkSymbol;
}): AccountHistoryMovement => {
    const networkType = getNetworkType(coin);
    switch (networkType) {
        case 'bitcoin':
            return getAccountHistoryMovementItemBTC({ transactions });
        case 'ripple':
            return getAccountHistoryMovementItemRipple({ transactions });
        case 'ethereum':
            return getAccountHistoryMovementItemETH({ transactions });
        default:
            throw new Error(`getAccountHistoryMovementItem: Unsupported network ${coin}`);
    }
};
