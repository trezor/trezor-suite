import type { Block, Transaction } from 'viem';

import { RESPONSES } from '@trezor/blockchain-link-types/src/constants';
import type * as Responses from '@trezor/blockchain-link-types/src/responses';

const mapBlockTransaction = (
    tx: Transaction,
    blockHash: string,
    blockHeight: number,
    blockTime: number,
    confirmations: number,
): Responses.GetBlock['payload']['txs'][number] => ({
    txid: tx.hash,
    vin: [
        {
            addresses: [tx.from],
            isAddress: true,
            n: 0,
        },
    ],
    vout: tx.to
        ? [
              {
                  addresses: [tx.to],
                  value: tx.value.toString(10),
                  n: 0,
                  isAddress: true,
              },
          ]
        : [],
    blockHash,
    blockHeight,
    blockTime,
    value: tx.value.toString(10),
    fees: tx.gas && tx.gasPrice ? (tx.gas * tx.gasPrice).toString(10) : '0',
    confirmations,
});

interface MapGetBlockResponseParams {
    block: Block;
    currentBlockHeight: number;
}

export const mapGetBlockResponse = ({
    block,
    currentBlockHeight,
}: MapGetBlockResponseParams): Responses.GetBlock => {
    const blockHeight = Number(block.number);
    const blockTime = Number(block.timestamp);
    const confirmations = currentBlockHeight - blockHeight + 1;

    const transactions = (block.transactions || []).filter(
        (tx): tx is Transaction => typeof tx !== 'string',
    );

    const txCount = transactions.length;
    const blockHash = block.hash || '';

    return {
        type: RESPONSES.GET_BLOCK,
        payload: {
            page: 1,
            totalPages: 1,
            itemsOnPage: txCount,
            hash: blockHash,
            height: blockHeight,
            txCount,
            txs: transactions.map(tx =>
                mapBlockTransaction(tx, blockHash, blockHeight, blockTime, confirmations),
            ),
        },
    };
};
