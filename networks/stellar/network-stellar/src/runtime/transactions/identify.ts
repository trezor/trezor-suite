import { Horizon, StrKey, extractBaseAddress } from '@stellar/stellar-sdk';

import { BigNumber } from '@trezor/utils';

import { type StellarBalanceDelta, readBalanceDeltas } from './balances';
import { decodeSorobanInvocation } from './decodeContractCall';
import { toStroops } from '../../constants';
import { parseCanonicalAsset } from '../assets';

type OperationRecord = Horizon.ServerApi.OperationRecord;
type TransactionRecord = Horizon.ServerApi.TransactionRecord;
type EffectRecord = Horizon.ServerApi.EffectRecord;
type OperationResponseType = Horizon.HorizonApi.OperationResponseType;

const { OperationResponseType: OperationType } = Horizon.HorizonApi;

/**
 * What a transaction did, for a record whose amounts come from its effects: the effects say what
 * moved, never which operation moved it. Kinds that read the same to a holder share one label.
 */
export type StellarOperationType =
    | 'accountMerge'
    | 'allowTrust'
    | 'bumpSequence'
    | 'changeTrust'
    | 'claimClaimableBalance'
    | 'clawback'
    | 'createAccount'
    | 'createClaimableBalance'
    | 'footprint'
    | 'inflation'
    | 'invokeHostFunction'
    | 'liquidityPool'
    | 'manageData'
    | 'offer'
    | 'pathPayment'
    | 'payment'
    | 'setOptions'
    | 'sponsorship'
    | 'trustLineFlags';

// A mapping, not a switch, so a new Horizon operation type fails to compile until it has a label.
const OPERATION_TYPES: Record<OperationResponseType, StellarOperationType> = {
    [OperationType.accountMerge]: 'accountMerge',
    [OperationType.allowTrust]: 'allowTrust',
    [OperationType.beginSponsoringFutureReserves]: 'sponsorship',
    [OperationType.bumpFootprintExpiration]: 'footprint',
    [OperationType.bumpSequence]: 'bumpSequence',
    [OperationType.changeTrust]: 'changeTrust',
    [OperationType.claimClaimableBalance]: 'claimClaimableBalance',
    [OperationType.clawback]: 'clawback',
    [OperationType.clawbackClaimableBalance]: 'clawback',
    [OperationType.createAccount]: 'createAccount',
    [OperationType.createClaimableBalance]: 'createClaimableBalance',
    [OperationType.createPassiveOffer]: 'offer',
    [OperationType.endSponsoringFutureReserves]: 'sponsorship',
    [OperationType.inflation]: 'inflation',
    [OperationType.invokeHostFunction]: 'invokeHostFunction',
    [OperationType.liquidityPoolDeposit]: 'liquidityPool',
    [OperationType.liquidityPoolWithdraw]: 'liquidityPool',
    [OperationType.manageBuyOffer]: 'offer',
    [OperationType.manageData]: 'manageData',
    [OperationType.manageOffer]: 'offer',
    [OperationType.pathPayment]: 'pathPayment',
    [OperationType.pathPaymentStrictSend]: 'pathPayment',
    [OperationType.payment]: 'payment',
    [OperationType.restoreFootprint]: 'footprint',
    [OperationType.revokeSponsorship]: 'sponsorship',
    [OperationType.setOptions]: 'setOptions',
    [OperationType.setTrustLineFlags]: 'trustLineFlags',
};

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
            // Horizon returns these base64-encoded, the rest of Suite expects hex.
            return Buffer.from(memo, 'base64').toString('hex');
        default:
            return undefined;
    }
};

const isClassicAsset = (assetType: string) =>
    assetType === 'credit_alphanum4' || assetType === 'credit_alphanum12';

// A balance-change counterparty can be a `C…` contract, which `extractBaseAddress` throws on.
const toBaseAddress = (address: string): string =>
    StrKey.isValidMed25519PublicKey(address) ? extractBaseAddress(address) : address;

// `mint` has no `from` and `burn`/`clawback` have no `to`, so the issuer stands in for the missing
// side. Horizon also marshals a call that moved nothing as `null`, though the SDK types an array.
const identifyBalanceChanges = (changes: BalanceChange[] | null): TokenTransferInfo[] =>
    (changes ?? [])
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

type CommonFields = {
    memo: string | undefined;
    feeSource: string;
    hash: string;
    fee: string;
    createdAt: number;
    ledgerAttr: number;
};

/** One side of a conversion: an amount in stroops, of the native asset when `asset` is absent. */
export type StellarAssetAmount = {
    amount: string;
    asset?: { assetCode: string; assetIssuer: string };
};

type ReadAssetAmountParams = {
    assetType: string;
    assetCode?: string;
    assetIssuer?: string;
    amount: string;
};

const readAssetAmount = ({
    assetType,
    assetCode,
    assetIssuer,
    amount,
}: ReadAssetAmountParams): StellarAssetAmount | undefined => {
    const stroops = toStroops(amount).toString();

    if (assetType === 'native') {
        return { amount: stroops };
    }

    return assetCode && assetIssuer
        ? { amount: stroops, asset: { assetCode, assetIssuer } }
        : undefined;
};

// Operations that change the ledger without ever moving a balance, so reporting no movement is the
// whole truth about them. Elsewhere a missing movement may just be Horizon not having said.
const LEDGER_ONLY_OPERATIONS: ReadonlySet<StellarOperationType> = new Set([
    'allowTrust',
    'bumpSequence',
    'changeTrust',
    'footprint',
    'manageData',
    'offer',
    'setOptions',
    'sponsorship',
    'trustLineFlags',
]);

type DescribeByBalanceParams = {
    common: CommonFields;
    deltas: StellarBalanceDelta[];
    operationType?: StellarOperationType;
};

/**
 * What a transaction did when its operations cannot say so themselves: the movements Horizon
 * reported through its effects, named by the operation that caused them. A transaction with neither
 * stays `unknown`, which is what Suite's stellar spam filter keys on, so it keeps failing closed.
 */
const describeByBalance = ({ common, deltas, operationType }: DescribeByBalanceParams) => {
    if (deltas.length > 0) {
        return { type: 'balance-change', ...common, deltas, operationType } as const;
    }

    if (operationType && LEDGER_ONLY_OPERATIONS.has(operationType)) {
        return { type: 'ledger-change', ...common, operationType } as const;
    }

    return { type: 'unknown', ...common } as const;
};

/**
 * Maps one transaction's operations onto the shape `transformTransaction` consumes. Horizon
 * pre-decodes classic operations, but a host function is reported only through its balance
 * changes, so its call is read from the envelope XDR the same record already carries.
 *
 * The operations resource states what was *asked* for, and only for the types Horizon decodes;
 * `effects` are what the ledger did to the account, so they describe every operation type — see
 * `describeByBalance`.
 */
export const identifyTransaction = (
    operations: OperationRecord[],
    rawTx: TransactionRecord,
    effects: readonly EffectRecord[] = [],
) => {
    // For fee-bump transactions the fee is paid by fee_account, not by the inner source_account
    const feeSource = extractBaseAddress(rawTx.fee_account || rawTx.source_account);
    const fee = rawTx.fee_charged.toString();
    const createdAt = isoToTimestamp(rawTx.created_at);
    const { hash, ledger_attr: ledgerAttr } = rawTx;
    const memo = convertMemo(rawTx);

    const common: CommonFields = { memo, feeSource, hash, fee, createdAt, ledgerAttr };

    if (!rawTx.successful) {
        return { type: 'failed', ...common } as const;
    }

    const deltas = readBalanceDeltas(effects);
    const operation = operations[0];

    if (!operation || operations.length !== 1) {
        // Several operations of one transaction cannot be expressed as a single transfer, but the
        // netted movements describe it exactly; which operation to name is ambiguous, so none is.
        return describeByBalance({ common, deltas });
    }

    const operationType = OPERATION_TYPES[operation.type];

    switch (operation.type) {
        case Horizon.HorizonApi.OperationResponseType.createAccount:
            return {
                type: 'create-account',
                ...common,
                fromAddress: extractBaseAddress(operation.funder),
                toAddress: extractBaseAddress(operation.account),
                amount: toStroops(operation.starting_balance),
            } as const;
        case Horizon.HorizonApi.OperationResponseType.payment: {
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

            // A payment of a liquidity-pool share has no representation here, so it keeps failing
            // closed unless the effects said what moved.
            if (!isClassicAsset(operation.asset_type)) {
                return describeByBalance({ common, deltas });
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
        case Horizon.HorizonApi.OperationResponseType.changeTrust: {
            // A liquidity-pool share carries no asset code, so the detailed trustline record cannot
            // be built; the operation still moves nothing, so it is named rather than left
            // undecodable, which the spam filter reads as suspicious.
            if (!isClassicAsset(operation.asset_type) || !operation.asset_code) {
                return describeByBalance({ common, deltas, operationType });
            }

            return {
                type: 'change-trust',
                ...common,
                fromAddress: extractBaseAddress(operation.trustor),
                assetCode: operation.asset_code,
                isRemoval: new BigNumber(operation.limit).isZero(),
            } as const;
        }
        case Horizon.HorizonApi.OperationResponseType.invokeHostFunction: {
            const transfers = identifyBalanceChanges(operation.asset_balance_changes);
            const invocation = decodeSorobanInvocation(rawTx.envelope_xdr);

            // A call that could not be read and whose movements Horizon does not report is opaque.
            if (transfers.length === 0 && !invocation) {
                return describeByBalance({ common, deltas });
            }

            // Balance changes cover classic assets only, so the effects come along as what moved.
            return { type: 'contract-call', ...common, transfers, invocation, deltas } as const;
        }
        // Both path payments carry the whole conversion, the shape every swap aggregator submits.
        case OperationType.pathPayment:
        case OperationType.pathPaymentStrictSend: {
            const sent = readAssetAmount({
                assetType: operation.source_asset_type,
                assetCode: operation.source_asset_code,
                assetIssuer: operation.source_asset_issuer,
                amount: operation.source_amount,
            });
            const received = readAssetAmount({
                assetType: operation.asset_type,
                assetCode: operation.asset_code,
                assetIssuer: operation.asset_issuer,
                amount: operation.amount,
            });

            if (!sent || !received) {
                return describeByBalance({ common, deltas, operationType });
            }

            return {
                type: 'path-payment',
                ...common,
                operationType,
                fromAddress: extractBaseAddress(operation.from),
                toAddress: extractBaseAddress(operation.to),
                sent,
                received,
            } as const;
        }
        // Nothing has moved yet: the account is being *offered* value that arrives only if a
        // claimant claims it — also the shape unsolicited-asset spam takes, so no amount is
        // recorded and the claim reports the real one.
        case OperationType.createClaimableBalance:
            return {
                type: 'claimable-balance-offer',
                ...common,
                operationType,
                fromAddress: extractBaseAddress(operation.source_account),
                claimants: operation.claimants.map(({ destination }) => toBaseAddress(destination)),
                asset: parseCanonicalAsset(operation.asset),
                offeredAmount: toStroops(operation.amount).toString(),
            } as const;
        default:
            return describeByBalance({ common, deltas, operationType });
    }
};
