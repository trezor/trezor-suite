// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/stellarSignTx.js

import {
    Asset,
    Keypair,
    type Memo,
    MemoHash,
    MemoID,
    MemoReturn,
    MemoText,
    type Signer,
    type Transaction,
} from '@stellar/stellar-sdk';

import { ERRORS } from '@trezor/connect-common/src/constants';
import type {
    StellarOperationMessage,
    StellarTransaction,
} from '@trezor/connect-common/src/types/api/stellar';
import { StellarOperation } from '@trezor/connect-common/src/types/api/stellar';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import type { TypedCall } from '../../device/DeviceCommands';

const processTxRequest = async (
    typedCall: TypedCall,
    operations: StellarOperationMessage[],
    index: number,
): Promise<PROTO.StellarSignedTx> => {
    const lastOp = index + 1 >= operations.length;
    const { type, ...op } = operations[index];

    if (lastOp) {
        const response = await typedCall(type, 'StellarSignedTx', op);

        return response.message;
    }
    await typedCall(type, 'StellarTxOpRequest', op);

    return processTxRequest(typedCall, operations, index + 1);
};

// transform incoming parameters to protobuf messages format
const transformSignMessage = (tx: StellarTransaction) => {
    if (!tx.timebounds) {
        throw ERRORS.TypedError(
            'Runtime',
            'transformSignMessage: Unspecified timebounds are not supported',
        );
    }

    const msg: PROTO.StellarSignTx = {
        address_n: [], // will be overridden
        network_passphrase: '', // will be overridden
        source_account: tx.source,
        fee: tx.fee,
        sequence_number: tx.sequence,
        timebounds_start: tx.timebounds.minTime,
        timebounds_end: tx.timebounds.maxTime,
        memo_type: PROTO.StellarMemoType.NONE,
        num_operations: tx.operations.length,
    };

    if (tx.memo) {
        msg.memo_type = tx.memo.type;
        msg.memo_text = tx.memo.text;
        msg.memo_id = tx.memo.id;
        msg.memo_hash = tx.memo.hash;
    }

    return msg;
};

// transform incoming parameters to protobuf messages format
const transformOperation = (op: StellarOperation): StellarOperationMessage | undefined => {
    Assert(StellarOperation, op);

    switch (op.type) {
        case 'createAccount':
            return {
                type: 'StellarCreateAccountOp',
                source_account: op.source,
                new_account: op.destination,
                starting_balance: op.startingBalance,
            };

        case 'payment':
            return {
                type: 'StellarPaymentOp',
                source_account: op.source,
                destination_account: op.destination,
                asset: op.asset,
                amount: op.amount,
            };

        case 'pathPaymentStrictReceive':
            return {
                type: 'StellarPathPaymentStrictReceiveOp',
                source_account: op.source,
                send_asset: op.sendAsset,
                send_max: op.sendMax,
                destination_account: op.destination,
                destination_asset: op.destAsset,
                destination_amount: op.destAmount,
                paths: op.path,
            };

        case 'pathPaymentStrictSend':
            return {
                type: 'StellarPathPaymentStrictSendOp',
                source_account: op.source,
                send_asset: op.sendAsset,
                send_amount: op.sendAmount,
                destination_account: op.destination,
                destination_asset: op.destAsset,
                destination_min: op.destMin,
                paths: op.path,
            };

        case 'createPassiveSellOffer':
            return {
                type: 'StellarCreatePassiveSellOfferOp',
                source_account: op.source,
                buying_asset: op.buying,
                selling_asset: op.selling,
                amount: op.amount,
                price_n: op.price.n,
                price_d: op.price.d,
            };

        case 'manageSellOffer':
            return {
                type: 'StellarManageSellOfferOp',
                source_account: op.source,
                buying_asset: op.buying,
                selling_asset: op.selling,
                amount: op.amount,
                offer_id: op.offerId || 0,
                price_n: op.price.n,
                price_d: op.price.d,
            };

        case 'manageBuyOffer':
            return {
                type: 'StellarManageBuyOfferOp',
                source_account: op.source,
                buying_asset: op.buying,
                selling_asset: op.selling,
                amount: op.amount,
                offer_id: op.offerId || 0,
                price_n: op.price.n,
                price_d: op.price.d,
            };

        case 'setOptions': {
            const signer = op.signer
                ? {
                      signer_type: op.signer.type,
                      signer_key: op.signer.key,
                      signer_weight: op.signer.weight,
                  }
                : undefined;

            return {
                type: 'StellarSetOptionsOp',
                source_account: op.source,
                clear_flags: op.clearFlags,
                set_flags: op.setFlags,
                master_weight: op.masterWeight,
                low_threshold: op.lowThreshold,
                medium_threshold: op.medThreshold,
                high_threshold: op.highThreshold,
                home_domain: op.homeDomain,
                inflation_destination_account: op.inflationDest,
                ...signer,
            };
        }

        case 'changeTrust':
            return {
                type: 'StellarChangeTrustOp',
                source_account: op.source,
                asset: op.line,
                limit: op.limit,
            };

        case 'allowTrust':
            return {
                type: 'StellarAllowTrustOp',
                source_account: op.source,
                trusted_account: op.trustor,
                asset_type: op.assetType,
                asset_code: op.assetCode,
                is_authorized: !!op.authorize,
            };

        case 'accountMerge':
            return {
                type: 'StellarAccountMergeOp',
                source_account: op.source,
                destination_account: op.destination,
            };

        case 'manageData':
            return {
                type: 'StellarManageDataOp',
                source_account: op.source,
                key: op.name,
                value: op.value,
            };

        case 'bumpSequence':
            return {
                type: 'StellarBumpSequenceOp',
                source_account: op.source,
                bump_to: op.bumpTo,
            };
        case 'claimClaimableBalance':
            return {
                type: 'StellarClaimClaimableBalanceOp',
                source_account: op.source,
                balance_id: op.balanceId,
            };

        // no default
    }
};

export const stellarSignTx = async (
    typedCall: TypedCall,
    address_n: number[],
    networkPassphrase: string,
    tx: StellarTransaction,
    payment_req?: PROTO.PaymentRequest,
) => {
    const message = transformSignMessage(tx);
    message.address_n = address_n;
    message.network_passphrase = networkPassphrase;
    message.payment_req = payment_req;

    const operations: StellarOperationMessage[] = [];
    tx.operations.forEach(op => {
        const transformed = transformOperation(op);
        if (transformed) {
            operations.push(transformed);
        }
    });

    await typedCall('StellarSignTx', 'StellarTxOpRequest', message);

    return processTxRequest(typedCall, operations, 0);
};

// Inlined from the deprecated @trezor/connect-plugin-stellar so callers can pass
// a `@stellar/stellar-sdk` Transaction directly to TrezorConnect.stellarSignTransaction.
// The lazy-loaded stellar chunk pays the @stellar/stellar-sdk bundle cost; non-Stellar
// consumers do not.

const transformSigner = (signer: Signer) => {
    let type = 0;
    let key: string | undefined;
    const { weight } = signer;
    if ('ed25519PublicKey' in signer) {
        const keyPair = Keypair.fromPublicKey(signer.ed25519PublicKey);
        key = keyPair.rawPublicKey().toString('hex');
    }
    if ('preAuthTx' in signer && signer.preAuthTx instanceof Buffer) {
        type = 1;
        key = signer.preAuthTx.toString('hex');
    }
    if ('sha256Hash' in signer && signer.sha256Hash instanceof Buffer) {
        type = 2;
        key = signer.sha256Hash.toString('hex');
    }

    return { type, key, weight };
};

const transformAsset = (asset: Asset) => {
    if (asset.isNative()) {
        return {
            type: 0,
            code: asset.getCode(),
        };
    }

    return {
        type: asset.getAssetType() === 'credit_alphanum4' ? 1 : 2,
        code: asset.getCode(),
        issuer: asset.getIssuer(),
    };
};

const transformAmount = (amount: number | string) =>
    new BigNumber(amount).times(10000000).toString();

const transformMemo = (memo: Memo) => {
    switch (memo.type) {
        case MemoText:
            return { type: 1, text: memo.value!.toString('utf-8') };
        case MemoID:
            return { type: 2, id: memo.value!.toString('utf-8') };
        case MemoHash:
            return { type: 3, hash: memo.value!.toString('hex') };
        case MemoReturn:
            return { type: 4, hash: memo.value!.toString('hex') };
        default:
            return { type: 0 };
    }
};

const transformTimebounds = (timebounds: Transaction['timeBounds']) => {
    if (!timebounds) return undefined;

    return {
        minTime: Number.parseInt(timebounds.minTime, 10),
        maxTime: Number.parseInt(timebounds.maxTime, 10),
    };
};

export const transformTransaction = (path: string | number[], transaction: Transaction) => {
    const amounts = [
        'amount',
        'sendMax',
        'destAmount',
        'sendAmount',
        'destMin',
        'startingBalance',
        'limit',
        'buyAmount',
    ];
    const assets = ['asset', 'sendAsset', 'destAsset', 'selling', 'buying', 'line'];

    const operations = transaction.operations.map((o, i) => {
        const operation: any = { ...o };

        if (operation.signer) {
            operation.signer = transformSigner(operation.signer);
        }

        if (operation.path) {
            operation.path = operation.path.map(transformAsset);
        }

        if (typeof operation.price === 'string') {
            // @ts-expect-error access internal stellar-sdk XDR for price ratio
            const xdrOperation = transaction.tx.operations()[i];
            operation.price = {
                n: xdrOperation.body().value().price().n(),
                d: xdrOperation.body().value().price().d(),
            };
        }

        amounts.forEach(field => {
            if (typeof operation[field] === 'string') {
                operation[field] = transformAmount(operation[field]);
            }
        });

        assets.forEach(field => {
            if (operation[field]) {
                operation[field] = transformAsset(operation[field]);
            }
        });

        if (operation.type === 'allowTrust') {
            const allowTrustAsset = new Asset(operation.assetCode, operation.trustor);
            operation.assetType = transformAsset(allowTrustAsset).type;
        }

        if (operation.type === 'manageData' && operation.value) {
            operation.value = operation.value.toString('hex');
        }
        if (operation.type === 'manageBuyOffer') {
            operation.amount = operation.buyAmount;
            delete operation.buyAmount;
        }
        operation.type = o.type;

        return operation;
    });

    return {
        path,
        networkPassphrase: transaction.networkPassphrase,
        transaction: {
            source: transaction.source,
            fee: Number.parseInt(transaction.fee, 10),
            sequence: transaction.sequence,
            memo: transformMemo(transaction.memo),
            timebounds: transformTimebounds(transaction.timeBounds),
            operations,
        } as StellarTransaction,
    };
};

// Duck-type detection: stellar-sdk Transaction exposes operations as Operation[],
// `fee` as a string, and a `tx` XDR getter. Trezor's StellarTransaction shape
// has `fee: number`. We deliberately avoid `instanceof Transaction` to remain
// compatible with callers that bring their own (semver-compatible) stellar-sdk version.
export const isRawStellarTransaction = (tx: unknown): tx is Transaction =>
    typeof tx === 'object' &&
    tx !== null &&
    typeof (tx as { fee?: unknown }).fee === 'string' &&
    Array.isArray((tx as { operations?: unknown }).operations) &&
    typeof (tx as { networkPassphrase?: unknown }).networkPassphrase === 'string';
