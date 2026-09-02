import { Horizon, StrKey, extractBaseAddress } from '@stellar/stellar-sdk';

import { BigNumber } from '@trezor/utils';

import { toStroops } from '../../constants';

const { OperationResponseType } = Horizon.HorizonApi;

type OperationRecord = Horizon.ServerApi.OperationRecord;
type TransactionRecord = Horizon.ServerApi.TransactionRecord;

// Horizon omits `from` on mint and `to` on burn/clawback, though the SDK types both as required.
type BalanceChange = Omit<Horizon.HorizonApi.BalanceChange, 'from' | 'to'> & {
    from?: string;
    to?: string;
};

export type TokenTransferInfo = {
    assetCode: string;
    assetIssuer: string;
    amount: string;
    fromAddress: string;
    toAddress: string;
};

const isoToTimestamp = (isoDate: string): number => {
    const timestamp = Date.parse(isoDate);

    if (isNaN(timestamp)) {
        throw new Error('Invalid ISO date string');
    }

    return Math.floor(timestamp / 1000);
};

const convertMemo = ({ memo, memo_type: memoType }: TransactionRecord): string | undefined => {
    if (memo === undefined) return undefined;

    switch (memoType) {
        case 'text':
        case 'id':
            return memo;
        case 'hash':
        case 'return':
            // Horizon returns these base64-encoded, the rest of Suite expects hex
            return Buffer.from(memo, 'base64').toString('hex');
        default:
            return undefined;
    }
};

const isClassicAsset = (assetType: string) =>
    assetType === 'credit_alphanum4' || assetType === 'credit_alphanum12';

// `extractBaseAddress` throws for anything that is not a `G…`/`M…` key, and a balance-change
// counterparty can be a `C…` contract (any DeFi interaction), so only muxed addresses are unwrapped.
const toBaseAddress = (address: string): string =>
    StrKey.isValidMed25519PublicKey(address) ? extractBaseAddress(address) : address;

/**
 * A Stellar Asset Contract reports transfers as balance changes on the host-function
 * operation. `mint` has no `from` and `burn`/`clawback` have no `to`, so the asset issuer
 * stands in for the missing side.
 */
const identifyBalanceChanges = (changes: BalanceChange[]): TokenTransferInfo[] =>
    changes
        .filter(
            (change): change is BalanceChange & { asset_code: string; asset_issuer: string } =>
                isClassicAsset(change.asset_type) && !!change.asset_code && !!change.asset_issuer,
        )
        .map(change => ({
            assetCode: change.asset_code,
            assetIssuer: change.asset_issuer,
            amount: toStroops(change.amount).toString(),
            fromAddress: toBaseAddress(change.from ?? change.asset_issuer),
            toAddress: toBaseAddress(change.to ?? change.asset_issuer),
        }));

/**
 * Maps the operations of a single transaction that the account participates in onto the
 * shape `transformTransaction` consumes. Horizon pre-decodes every operation, so no
 * envelope XDR is parsed here.
 */
export const identifyTransaction = (operations: OperationRecord[], rawTx: TransactionRecord) => {
    // For fee-bump transactions the fee is paid by fee_account, not by the inner source_account
    const feeSource = extractBaseAddress(rawTx.fee_account || rawTx.source_account);
    const fee = rawTx.fee_charged.toString();
    const createdAt = isoToTimestamp(rawTx.created_at);
    const { hash, ledger_attr: ledgerAttr } = rawTx;
    const memo = convertMemo(rawTx);

    // In Stellar, there are many types of operations; currently, we only include limited support and will consider adding more support later.
    const common = { memo, feeSource, hash, fee, createdAt, ledgerAttr };

    if (!rawTx.successful) {
        return { type: 'failed', ...common } as const;
    }

    const operation = operations[0];

    if (!operation || operations.length !== 1) {
        // The account taking part in several operations of one transaction cannot be
        // expressed as a single transfer, so it stays unknown.
        return { type: 'unknown', ...common } as const;
    }

    switch (operation.type) {
        case OperationResponseType.createAccount:
            return {
                type: 'create-account',
                ...common,
                fromAddress: extractBaseAddress(operation.funder),
                toAddress: extractBaseAddress(operation.account),
                amount: toStroops(operation.starting_balance),
            } as const;
        case OperationResponseType.payment: {
            const fromAddress = extractBaseAddress(operation.from);
            const toAddress = extractBaseAddress(operation.to);

            if (operation.asset_type === 'native') {
                return {
                    type: 'payment-native',
                    ...common,
                    fromAddress,
                    toAddress,
                    amount: toStroops(operation.amount),
                } as const;
            }

            if (!isClassicAsset(operation.asset_type)) {
                return { type: 'unknown', ...common } as const;
            }

            return {
                type: 'token-transfer',
                ...common,
                transfers: [
                    {
                        assetCode: operation.asset_code!,
                        assetIssuer: operation.asset_issuer!,
                        amount: toStroops(operation.amount).toString(),
                        fromAddress,
                        toAddress,
                    },
                ],
            } as const;
        }
        case OperationResponseType.changeTrust: {
            // Only support regular assets, not liquidity pool shares
            if (!isClassicAsset(operation.asset_type) || !operation.asset_code) {
                return { type: 'unknown', ...common } as const;
            }

            return {
                type: 'change-trust',
                ...common,
                fromAddress: extractBaseAddress(operation.trustor),
                assetCode: operation.asset_code,
                isRemoval: new BigNumber(operation.limit).isZero(),
            } as const;
        }
        case OperationResponseType.invokeHostFunction: {
            const transfers = identifyBalanceChanges(operation.asset_balance_changes);

            if (transfers.length === 0) {
                return { type: 'unknown', ...common } as const;
            }

            return { type: 'token-transfer', ...common, transfers } as const;
        }
        default:
            return { type: 'unknown', ...common } as const;
    }
};
