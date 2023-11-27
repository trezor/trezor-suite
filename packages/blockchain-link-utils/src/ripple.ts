import type { Transaction } from '@trezor/blockchain-link-types';

// export const transformServerInfo = (payload: GetServerInfoResponse) => {
export const transformServerInfo = (payload: any) => ({
    name: 'Ripple',
    shortcut: 'xrp',
    testnet: false,
    version: payload.buildVersion,
    decimals: 6,
    blockHeight: payload.validatedLedger.ledgerVersion,
    blockHash: payload.validatedLedger.hash,
});

// https://bitcoin.stackexchange.com/questions/23061/ripple-ledger-time-format/23065#23065
const BLOCKTIME_OFFSET = 946684800;

export const transformTransaction = (tx: any, descriptor?: string): Transaction => {
    const blockTime =
        typeof tx.date === 'number' && tx.date > 0 ? tx.date + BLOCKTIME_OFFSET : tx.date;
    const type =
        tx.TransactionType !== 'Payment' || !descriptor
            ? 'unknown'
            : (tx.Account === descriptor && 'sent') || 'recv';
    const addresses = [tx.Destination];
    const amount = tx.Amount;
    const fee = tx.Fee;

    // TODO: https://github.com/ripple/ripple-lib/blob/develop/docs/index.md#transaction-types
    return {
        type,
        txid: tx.hash,
        amount,
        fee,
        blockTime,
        blockHeight: tx.ledger_index,
        blockHash: tx.hash,
        targets:
            type === 'unknown'
                ? []
                : [
                      {
                          addresses,
                          isAddress: true,
                          amount,
                          n: 0, // no multi-targets in ripple
                      },
                  ],
        tokens: [],
        internalTransfers: [],
        feeRate: undefined,
        details: {
            vin: [],
            vout: [],
            size: 0,
            totalInput: '0',
            totalOutput: '0',
        },
    };
};
