// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/stellarSignTx.js

import type { StellarOperationMessage, StellarTransaction } from '@trezor/connect-common';
import { StellarOperation } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';
import { exhaustive } from '@trezor/type-utils';
import { throwError } from '@trezor/utils';

import type { TypedCall } from '../../device/DeviceCommands';

// transform incoming parameters to protobuf messages format
const transformSignMessage = (
    tx: StellarTransaction,
    base: Pick<PROTO.StellarSignTx, 'address_n' | 'network_passphrase' | 'payment_req'>,
): PROTO.StellarSignTx => {
    if (!tx.timebounds) {
        throw ERRORS.TypedError(
            'Runtime',
            'transformSignMessage: Unspecified timebounds are not supported',
        );
    }

    return {
        ...base,
        source_account: tx.source,
        fee: tx.fee,
        sequence_number: tx.sequence,
        timebounds_start: tx.timebounds.minTime,
        timebounds_end: tx.timebounds.maxTime,
        memo_type: PROTO.StellarMemoType.NONE,
        num_operations: tx.operations.length,
        ...(tx.memo && {
            memo_type: tx.memo.type,
            memo_text: tx.memo.text,
            memo_id: tx.memo.id,
            memo_hash: tx.memo.hash,
        }),
    };
};

// transform incoming parameters to protobuf messages format
const transformOperation = (op: StellarOperation): StellarOperationMessage => {
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

        case 'invokeHostFunction':
            // `function` and `auth` are already in protobuf shape (built by network-stellar).
            return {
                type: 'StellarInvokeHostFunctionOp',
                source_account: op.source,
                function: op.function,
                auth: op.auth,
            };

        case 'inflation':
            // There is no StellarInflationOp protobuf message, so the device cannot sign it.
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                'Stellar inflation operation is not supported',
            );

        default:
            return exhaustive(op);
    }
};

export const stellarSignTx = async (
    typedCall: TypedCall,
    address_n: number[],
    network_passphrase: string,
    tx: StellarTransaction,
    payment_req?: PROTO.PaymentRequest,
) => {
    const message = transformSignMessage(tx, { address_n, network_passphrase, payment_req });
    const operations = tx.operations.map(transformOperation);

    await typedCall('StellarSignTx', 'StellarTxOpRequest', message);

    for (const { type, ...op } of operations.slice(0, -1)) {
        await typedCall(type, 'StellarTxOpRequest', op);
    }

    const { type, ...op } =
        operations.at(-1) ??
        throwError(
            ERRORS.TypedError(
                'Method_InvalidParameter',
                `Stellar transaction doesn't include any valid operation.`,
            ),
        );

    // Soroban (InvokeHostFunction) transactions carry a transaction extension
    // (SorobanTransactionData). After the final operation the device requests it via
    // StellarTxExtRequest and only then returns the signature.
    const isSoroban = operations.some(o => o.type === 'StellarInvokeHostFunctionOp');

    if (isSoroban) {
        if (!tx.sorobanData) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                'Soroban transaction is missing sorobanData (SorobanTransactionData XDR).',
            );
        }

        await typedCall(type, 'StellarTxExtRequest', op);

        const response = await typedCall('StellarTxExt', 'StellarSignedTx', {
            v: 1,
            soroban_data: tx.sorobanData,
        });

        return response.message;
    }

    const response = await typedCall(type, 'StellarSignedTx', op);

    if (response.type !== 'StellarTxExtRequest') {
        return response.message;
    }

    // Soroban transactions carry the footprint and resource limits outside the operation, and the
    // device asks for them once every operation has been confirmed. Only a Soroban operation makes
    // the device ask, and such a transaction is invalid without them, so signing whatever we have
    // would only produce an envelope the network rejects.
    if (!tx.ext?.sorobanData) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            'Stellar transaction is missing the Soroban transaction data the device asked for',
        );
    }

    const ext = await typedCall('StellarTxExt', 'StellarSignedTx', {
        v: tx.ext.v,
        // protobuf bytes fields travel as hex; handing over the base64 XDR would silently encode
        // only the leading hex-looking characters, and the device would sign a different digest
        soroban_data: Buffer.from(tx.ext.sorobanData, 'base64').toString('hex'),
    });

    return ext.message;
};
