import {
    type Asset,
    type Horizon,
    type Memo,
    Networks,
    Transaction,
    extractBaseAddress,
} from '@stellar/stellar-sdk';

import { BigNumber } from '@trezor/utils';

import { toStroops } from '../../constants';

const isoToTimestamp = (isoDate: string): number => {
    const timestamp = Date.parse(isoDate);

    if (isNaN(timestamp)) {
        throw new Error('Invalid ISO date string');
    }

    return Math.floor(timestamp / 1000);
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
    // In Stellar, there are many types of operations; currently, we only include limited support and will consider adding more support later.
    const parsedTx = new Transaction(rawTx.envelope_xdr, Networks.PUBLIC);
    const memo = convertMemo(parsedTx.memo);
    const feeSource = extractBaseAddress(rawTx.source_account);
    const fee = rawTx.fee_charged.toString();
    const createdAt = isoToTimestamp(rawTx.created_at);
    const { hash, ledger_attr: ledgerAttr } = rawTx;
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

            return { type: 'change-trust', ...common, fromAddress, assetCode, isRemoval } as const;
        }
        default:
            // We only support createAccount and payment operations for now, so we consider it as a unknown type
            return { type: 'unknown', ...common } as const;
    }
};
