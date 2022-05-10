// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/stellarSignTx.js

import { PROTO, ERRORS } from '../../constants';
import { validateParams } from '../common/paramsValidator';
import type { TypedCall } from '../../device/DeviceCommands';
import type {
    StellarTransaction,
    StellarOperation,
    StellarOperationMessage,
} from '../../types/api/stellarSignTransaction';

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
    switch (op.type) {
        case 'createAccount':
            validateParams(op, [
                { name: 'destination', type: 'string', required: true },
                { name: 'startingBalance', type: 'uint', required: true },
            ]);
            return {
                type: 'StellarCreateAccountOp',
                source_account: op.source,
                new_account: op.destination,
                starting_balance: op.startingBalance,
            };

        case 'payment':
            validateParams(op, [
                { name: 'destination', type: 'string', required: true },
                { name: 'amount', type: 'uint', required: true },
            ]);
            return {
                type: 'StellarPaymentOp',
                source_account: op.source,
                destination_account: op.destination,
                asset: op.asset,
                amount: op.amount,
            };

        case 'pathPaymentStrictReceive':
            validateParams(op, [{ name: 'destAmount', type: 'uint', required: true }]);
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
            validateParams(op, [{ name: 'destMin', type: 'uint', required: true }]);
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
            validateParams(op, [{ name: 'amount', type: 'uint', required: true }]);
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
            validateParams(op, [{ name: 'amount', type: 'uint', required: true }]);
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
            validateParams(op, [{ name: 'amount', type: 'uint', required: true }]);
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
            validateParams(op, [{ name: 'limit', type: 'uint' }]);
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

        // no default
    }
};

export const stellarSignTx = async (
    typedCall: TypedCall,
    address_n: number[],
    networkPassphrase: string,
    tx: StellarTransaction,
) => {
    const message = transformSignMessage(tx);
    message.address_n = address_n;
    message.network_passphrase = networkPassphrase;

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
