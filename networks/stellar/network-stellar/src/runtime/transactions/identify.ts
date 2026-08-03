import {
    type Asset,
    FeeBumpTransaction,
    type Horizon,
    type Memo,
    Networks,
    type Transaction,
    TransactionBuilder,
    extractBaseAddress,
} from '@stellar/stellar-sdk';

import { BigNumber } from '@trezor/utils';

import { toStroops } from '../../constants';

const isoToTimestamp = (isoDate: string): number | undefined => {
    const timestamp = Date.parse(isoDate);

    if (isNaN(timestamp)) {
        // A malformed timestamp from an untrusted Horizon backend must not throw out of the
        // whole account-history map — degrade to an undefined blockTime for this record.
        return undefined;
    }

    return Math.floor(timestamp / 1000);
};

// extractBaseAddress throws on a malformed/muxed address; an untrusted Horizon backend fully
// controls source_account/fee_account, so guard it to keep one bad record from failing the map.
const safeExtractBaseAddress = (address?: string): string => {
    if (!address) {
        return '';
    }

    try {
        return extractBaseAddress(address);
    } catch {
        return '';
    }
};

const convertMemo = (memo: Memo): string | undefined => {
    switch (memo.type) {
        case 'text':
        case 'id':
            return memo.value?.toString();
        case 'hash':
        case 'return':
            return memo.value?.toString('hex');
        default:
            return undefined;
    }
};

export const identifyTransaction = (rawTx: Horizon.ServerApi.TransactionRecord) => {
    const { hash, ledger_attr: ledgerAttr } = rawTx;
    // These three are always present on the identified record (incl. the 'unknown' fallback
    // below), so they must be derived without throwing — an untrusted Horizon backend controls
    // every field and a single malformed record must not fail the whole account history.
    // For fee-bump transactions the fee is paid by fee_account, not by the inner source_account.
    const feeSource = safeExtractBaseAddress(rawTx.fee_account || rawTx.source_account);
    const fee = rawTx.fee_charged?.toString() ?? '';
    const createdAt = isoToTimestamp(rawTx.created_at);

    try {
        const envelope = TransactionBuilder.fromXDR(rawTx.envelope_xdr, Networks.PUBLIC);
        const parsedTx: Transaction =
            envelope instanceof FeeBumpTransaction ? envelope.innerTransaction : envelope;

        // In Stellar, there are many types of operations; currently, we only include limited support and will consider adding more support later.
        const memo = convertMemo(parsedTx.memo);
        const common = { parsedTx, memo, feeSource, hash, fee, createdAt, ledgerAttr };

        if (!rawTx.successful) {
            // If the transaction is not successful, we can set the type to 'failed' and return early
            return { type: 'failed', ...common } as const;
        }

        const rawOp = parsedTx.operations[0];

        if (!rawOp || parsedTx.operations.length !== 1) {
            // If the transaction has more than one operation, we consider it as a unknown type
            return { type: 'unknown', ...common } as const;
        }

        const opSource = rawOp.source || rawTx.source_account;
        const fromAddress = extractBaseAddress(opSource);

        switch (rawOp.type) {
            case 'createAccount':
                return {
                    type: 'create-account',
                    ...common,
                    fromAddress,
                    toAddress: extractBaseAddress(rawOp.destination),
                    amount: toStroops(rawOp.startingBalance),
                } as const;
            case 'payment': {
                const toAddress = extractBaseAddress(rawOp.destination);
                if (rawOp.asset.isNative()) {
                    return {
                        type: 'payment-native',
                        ...common,
                        fromAddress,
                        toAddress,
                        amount: toStroops(rawOp.amount),
                    } as const;
                } else {
                    return {
                        type: 'payment-token',
                        ...common,
                        fromAddress,
                        toAddress,
                        tokenInfo: {
                            assetCode: rawOp.asset.getCode(),
                            assetIssuer: rawOp.asset.getIssuer(),
                            amount: toStroops(rawOp.amount).toString(),
                        },
                    } as const;
                }
            }
            case 'changeTrust': {
                // Only support regular assets, not liquidity pool shares
                if (
                    rawOp.line.getAssetType() !== 'credit_alphanum4' &&
                    rawOp.line.getAssetType() !== 'credit_alphanum12'
                ) {
                    return { type: 'unknown', ...common } as const;
                }

                const line = rawOp.line as Asset;
                const assetCode = line.getCode();
                const isRemoval = new BigNumber(rawOp.limit).isZero();

                return {
                    type: 'change-trust',
                    ...common,
                    fromAddress,
                    assetCode,
                    isRemoval,
                } as const;
            }
            default:
                // We only support createAccount and payment operations for now, so we consider it as a unknown type
                return { type: 'unknown', ...common } as const;
        }
    } catch {
        // A single unparseable/misshapen record (bad XDR envelope, or any operation field that
        // makes extractBaseAddress/toStroops/BigNumber throw) must not fail the whole account
        // history — degrade this one record to 'unknown'.
        return {
            type: 'unknown',
            memo: undefined,
            feeSource,
            hash,
            fee,
            createdAt,
            ledgerAttr,
        } as const;
    }
};
