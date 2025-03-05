import type { AccountTxTransaction, ServerInfoResponse } from 'xrpl';

import type { ServerInfo, Transaction } from '@trezor/blockchain-link-types';

export const transformServerInfo = (payload: ServerInfoResponse): Omit<ServerInfo, 'url'> => ({
    name: 'Ripple',
    shortcut: 'xrp',
    network: 'xrp',
    testnet: false,
    version: payload.result.info.build_version,
    decimals: 6,
    blockHeight: payload.result.info.validated_ledger?.seq ?? 0,
    blockHash: payload.result.info.validated_ledger?.hash ?? '',
});

// XRPL timestamps are based on the Ripple Epoch (2000-01-01T00:00:00Z).
// To convert to a standard Unix timestamp, add this offset.
// https://xrpl.org/docs/references/protocol/data-types/basic-data-types#specifying-time
const BLOCKTIME_OFFSET = 946684800;

const getUnixTimestamp = (xrplTimestamp?: number): number => {
    if (!xrplTimestamp || xrplTimestamp <= 0) {
        return 0;
    }

    return xrplTimestamp + BLOCKTIME_OFFSET;
};

export const transformTransaction = (
    hash: string | undefined,
    tx_json: NonNullable<AccountTxTransaction['tx_json']>,
    meta: AccountTxTransaction['meta'] | undefined,
    descriptor?: string,
): Transaction => {
    let txType: Transaction['type'] = 'unknown';
    let addresses: string[] = [];
    let amount: string | undefined;
    let destinationTag: number | undefined;

    if (tx_json.TransactionType === 'Payment') {
        // https://xrpl.org/docs/references/protocol/transactions/types/payment
        // DeliverMax is a valid field on Payment response
        const deliverMax = (tx_json as { DeliverMax?: string }).DeliverMax ?? undefined;
        const isTokenTransaction = typeof deliverMax !== 'string';

        amount = !isTokenTransaction ? deliverMax : undefined;

        // https://xrpl.org/docs/references/protocol/transactions/transaction-results
        // Success - tes - (Not an error) The transaction succeeded. This result only final in a validated ledger.
        if (
            meta != null &&
            typeof meta !== 'string' &&
            !meta.TransactionResult?.startsWith('tes')
        ) {
            txType = 'failed';
        } else if (!descriptor || isTokenTransaction) {
            txType = 'unknown';
        } else {
            txType = tx_json.Account === descriptor ? 'sent' : 'recv';
        }

        addresses = [tx_json.Destination];
        destinationTag = tx_json.DestinationTag;
    }

    return {
        type: txType,
        txid: hash ?? '',
        amount: amount ?? '0',
        fee: tx_json.Fee ?? '0',
        blockTime: getUnixTimestamp(tx_json.date),
        blockHeight: tx_json.ledger_index,
        blockHash: hash ?? '',
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
