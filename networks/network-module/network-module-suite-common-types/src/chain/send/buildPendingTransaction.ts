import type { Target, TokenTransfer, Transaction } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import type { CreatePendingTransactionParams } from './ChainSend';

/**
 * The transaction just broadcast, as the history shows it until the backend lists it: sent now,
 * not yet in a block, paying what was composed.
 */
export const buildPendingTransaction = ({
    account,
    precomposed,
    txid,
}: CreatePendingTransactionParams): Transaction => {
    const { token } = precomposed;
    const outputs = precomposed.outputs.flatMap(output =>
        'address' in output && output.address
            ? [{ address: output.address, amount: String(output.amount) }]
            : [],
    );
    const amount = token
        ? '0'
        : new BigNumber(precomposed.totalSpent).minus(precomposed.fee).toFixed();

    const targets: Target[] = outputs.map((output, n) => ({
        n,
        addresses: [output.address],
        isAddress: true,
        amount: token ? '0' : output.amount,
    }));

    const tokens: TokenTransfer[] =
        token && outputs[0]
            ? [
                  {
                      type: 'sent',
                      standard: token.standard,
                      amount: outputs[0].amount,
                      from: account.descriptor,
                      to: outputs[0].address,
                      contract: token.contract,
                      name: token.name,
                      symbol: token.symbol,
                      decimals: token.decimals,
                  },
              ]
            : [];

    return {
        type: 'sent',
        txid,
        blockTime: Math.floor(Date.now() / 1000),
        amount,
        fee: precomposed.fee,
        targets,
        tokens,
        internalTransfers: [],
        details: {
            vin: [
                {
                    n: 0,
                    addresses: [account.descriptor],
                    isAddress: true,
                    isAccountOwned: true,
                },
            ],
            vout: [],
            size: 0,
            totalInput: '0',
            totalOutput: amount,
        },
    };
};
