import type { Block, Transaction, TransactionReceipt } from 'viem';

import { RESPONSES } from '@trezor/blockchain-link-types';
import type {
    EnhancedVinVout,
    InternalTransfer,
    ResponseTypes as Responses,
    TokenTransfer,
} from '@trezor/blockchain-link-types';

import { getTransactionType } from '../utils/transactionType';

interface MapTransactionParams {
    tx: Transaction;
    receipt?: TransactionReceipt;
    block?: Block;
    userAddress?: string;
}

const getTransactionStatus = (receipt?: TransactionReceipt): number => {
    if (receipt?.status === 'success') {
        return 1;
    }
    if (receipt?.status === 'reverted') {
        return 0;
    }

    return -1;
};

export const mapGetTransactionResponse = ({
    tx,
    receipt,
    block,
    userAddress,
}: MapTransactionParams): Responses.GetTransaction => {
    const { value, gasPrice } = tx;
    const effectiveGasPrice = receipt?.effectiveGasPrice ?? 0n;
    // effectiveGasPrice is the price actually charged and differs from the gasPrice bid on L2s;
    // use it when positive, otherwise fall back to the gasPrice bid (mirrors blockbook).
    const feeGasPrice = effectiveGasPrice > 0n ? effectiveGasPrice : (gasPrice ?? 0n);
    // A transaction that is not mined yet has no receipt, the fee it can cost at most is
    // the whole gas limit.
    const fee = ((receipt?.gasUsed ?? tx.gas) * feeGasPrice).toString(10);

    const blockTime = block ? Number(block.timestamp) : 0;
    const blockHash = tx.blockHash || '';
    // Consumers read blockHeight 0 as pending.
    const blockHeight = tx.blockNumber === null ? 0 : Number(tx.blockNumber);

    // this does not work as userAddress is not known. As of now it always returns 'unknown'
    const txType = userAddress
        ? getTransactionType({ from: tx.from, to: tx.to }, userAddress)
        : 'unknown';

    const tokens: TokenTransfer[] = [];
    const internalTransfers: InternalTransfer[] = [];

    const vin: EnhancedVinVout[] = [
        {
            addresses: [tx.from],
            isAddress: true,
            n: 0,
        },
    ];

    const vout: EnhancedVinVout[] = tx.to
        ? [
              {
                  addresses: [tx.to],
                  isAddress: true,
                  value: value.toString(),
                  n: 0,
              },
          ]
        : [];

    return {
        type: RESPONSES.GET_TRANSACTION,
        payload: {
            type: txType,
            txid: tx.hash,
            blockTime,
            blockHeight,
            blockHash,
            amount: value.toString(),
            fee,
            targets: tx.to
                ? [
                      {
                          addresses: [tx.to],
                          isAddress: true,
                          amount: value.toString(),
                          n: 0,
                      },
                  ]
                : [],
            tokens,
            internalTransfers,
            details: {
                vin,
                vout,
                size: tx.input ? (tx.input.length - 2) / 2 : 0,
                totalInput: value.toString(),
                totalOutput: value.toString(),
            },
            ethereumSpecific: {
                status: getTransactionStatus(receipt),
                nonce: tx.nonce,
                gasLimit: Number(tx.gas),
                gasUsed: receipt ? Number(receipt.gasUsed) : undefined,
                gasPrice: gasPrice?.toString(),
                effectiveGasPrice:
                    effectiveGasPrice > 0n ? effectiveGasPrice.toString() : undefined,
                data: tx.input,
            },
        },
    };
};
