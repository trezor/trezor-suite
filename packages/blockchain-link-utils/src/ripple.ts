import type { Transaction } from '@trezor/blockchain-link-types';

type RippleTransactionMetadata = {
    AffectedNodes: any[];
    DeliveredAmount?: any[];
    TransactionIndex: number;
    TransactionResult: string;
    delivered_amount?: string;
};

// export const transformServerInfo = (payload: GetServerInfoResponse) => {
export const transformServerInfo = (payload: any) => ({
    name: 'Ripple',
    shortcut: 'xrp',
    network: 'xrp',
    testnet: false,
    version: payload.buildVersion,
    decimals: 6,
    blockHeight: payload.validatedLedger.ledgerVersion,
    blockHash: payload.validatedLedger.hash,
});

// https://bitcoin.stackexchange.com/questions/23061/ripple-ledger-time-format/23065#23065
const BLOCKTIME_OFFSET = 946684800;

export const transformTransaction = (
    tx: any,
    meta: RippleTransactionMetadata | null,
    descriptor?: string,
): Transaction => {
    const blockTime =
        typeof tx.date === 'number' && tx.date > 0 ? tx.date + BLOCKTIME_OFFSET : tx.date;
    const isTokenTransaction = tx.Amount && typeof tx.Amount !== 'string';

    let txType: Transaction['type'];

    // https://xrpl.org/docs/references/protocol/transactions/transaction-results
    if (meta != null && !meta.TransactionResult?.startsWith('tes')) {
        txType = 'failed';
    } else if (tx.TransactionType !== 'Payment' || !descriptor || isTokenTransaction) {
        txType = 'unknown';
    } else {
        txType = tx.Account === descriptor ? 'sent' : 'recv';
    }

    const addresses = [tx.Destination];
    const amount = !isTokenTransaction ? tx.Amount : undefined;
    const fee = tx.Fee;
    const destinationTag = tx.DestinationTag;

    // TODO: https://github.com/ripple/ripple-lib/blob/develop/docs/index.md#transaction-types
    return {
        type: txType,
        txid: tx.hash,
        amount,
        fee,
        blockTime,
        blockHeight: tx.ledger_index,
        blockHash: tx.hash,
        targets:
            txType === 'unknown'
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
        rippleSpecific: {
            destinationTag,
        },
    };
};
