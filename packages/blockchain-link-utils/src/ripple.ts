import type { ServerInfo, Transaction } from '@trezor/blockchain-link-types';
import { RIPPLE_DECIMALS, getUnixTimestamp } from '@trezor/network-ripple/constants';
import type { AccountTxTransaction, ServerInfoResponse } from '@trezor/network-ripple/types';

export const transformServerInfo = (payload: ServerInfoResponse): Omit<ServerInfo, 'url'> => ({
    name: 'Ripple',
    shortcut: 'xrp',
    network: 'xrp',
    testnet: false,
    version: payload.result.info.build_version,
    decimals: RIPPLE_DECIMALS,
    blockHeight: payload.result.info.validated_ledger?.seq ?? 0,
    blockHash: payload.result.info.validated_ledger?.hash ?? '',
});

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

        // DeliverMax (formerly Amount) is only the MAXIMUM the sender authorised.
        // On a partial payment (Flags & tfPartialPayment) the amount actually delivered
        // can be anything up to DeliverMax, chosen by the sender - the XRPL docs are
        // explicit that DeliverMax/Amount must never be used to determine what was
        // delivered. meta.delivered_amount is the authoritative value; it's absent only
        // on legacy pre-delivered_amount ledgers, and reported as the string sentinel
        // 'unavailable' on some very old validated ledgers where it can't be determined.
        // https://xrpl.org/docs/references/protocol/transactions/metadata#delivered_amount
        const deliveredAmount =
            meta != null && typeof meta !== 'string' ? meta.delivered_amount : undefined;
        // delivered_amount is a string for a native XRP (drops) delivery, an object for
        // an issued-currency/MPT delivery, or the literal string 'unavailable' when the
        // server can't determine it - only the drops case is usable here, and it must be
        // told apart from the 'unavailable' sentinel, which is also typeof 'string'.
        const resolvedAmount =
            typeof deliveredAmount === 'string' && deliveredAmount !== 'unavailable'
                ? deliveredAmount
                : deliverMax;

        amount = !isTokenTransaction ? resolvedAmount : undefined;

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
