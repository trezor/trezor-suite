// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/tezosSignTx.js

import * as bs58check from 'bs58check';
import { PROTO, ERRORS } from '../../constants';
import type { TezosOperation } from '../../types/api/tezos';
import { validateParams } from '../common/paramsValidator';

const PREFIX = {
    B: new Uint8Array([1, 52]),
    tz1: new Uint8Array([6, 161, 159]),
    tz2: new Uint8Array([6, 161, 161]),
    tz3: new Uint8Array([6, 161, 164]),
    KT1: new Uint8Array([2, 90, 121]),
    edpk: new Uint8Array([13, 15, 37, 217]),
    sppk: new Uint8Array([3, 254, 226, 86]),
    p2pk: new Uint8Array([3, 178, 139, 127]),
};

const bs58checkDecode = (prefix: Uint8Array, enc: string): Uint8Array =>
    bs58check.decode(enc).slice(prefix.length);

const concatArray = (first: Uint8Array, second: Uint8Array) => {
    const result = new Uint8Array(first.length + second.length);
    result.set(first);
    result.set(second, first.length);
    return result;
};

// convert publicKeyHash to buffer
const publicKeyHash2buffer = (publicKeyHash: string) => {
    switch (publicKeyHash.substring(0, 3)) {
        case 'tz1':
            return {
                originated: 0,
                hash: concatArray(new Uint8Array([0]), bs58checkDecode(PREFIX.tz1, publicKeyHash)),
            };
        case 'tz2':
            return {
                originated: 0,
                hash: concatArray(new Uint8Array([1]), bs58checkDecode(PREFIX.tz2, publicKeyHash)),
            };
        case 'tz3':
            return {
                originated: 0,
                hash: concatArray(new Uint8Array([2]), bs58checkDecode(PREFIX.tz3, publicKeyHash)),
            };
        case 'KT1':
            return {
                originated: 1,
                hash: concatArray(bs58checkDecode(PREFIX.KT1, publicKeyHash), new Uint8Array([0])),
            };
        default:
            throw ERRORS.TypedError('Method_InvalidParameter', 'Wrong Tezos publicKeyHash address');
    }
};

// convert publicKeyHash to buffer
const publicKey2buffer = (publicKey: string) => {
    switch (publicKey.substring(0, 4)) {
        case 'edpk':
            return concatArray(new Uint8Array([0]), bs58checkDecode(PREFIX.edpk, publicKey));
        case 'sppk':
            return concatArray(new Uint8Array([1]), bs58checkDecode(PREFIX.sppk, publicKey));
        case 'p2pk':
            return concatArray(new Uint8Array([2]), bs58checkDecode(PREFIX.p2pk, publicKey));
        default:
            throw ERRORS.TypedError('Method_InvalidParameter', 'Wrong Tezos publicKey');
    }
};

export const createTx = (
    address_n: number[],
    branch: string,
    operation: TezosOperation,
    chunkify?: boolean,
) => {
    let message: PROTO.TezosSignTx = {
        address_n,
        branch: bs58checkDecode(PREFIX.B, branch),
        chunkify: typeof chunkify === 'boolean' ? chunkify : false,
    };

    // reveal public key
    if (operation.reveal) {
        const { reveal } = operation;

        // validate reveal parameters
        validateParams(reveal, [
            { name: 'source', type: 'string', required: true },
            { name: 'public_key', type: 'string', required: true },
            { name: 'fee', type: 'uint', required: true },
            { name: 'counter', type: 'number', required: true },
            { name: 'gas_limit', type: 'number', required: true },
            { name: 'storage_limit', type: 'number', required: true },
        ]);

        message = {
            ...message,
            reveal: {
                source: publicKeyHash2buffer(reveal.source).hash,
                public_key: publicKey2buffer(reveal.public_key),
                fee: reveal.fee,
                counter: reveal.counter,
                gas_limit: reveal.gas_limit,
                storage_limit: reveal.storage_limit,
            },
        };
    }

    // transaction
    if (operation.transaction) {
        const { transaction } = operation;

        // validate transaction parameters
        validateParams(transaction, [
            { name: 'source', type: 'string', required: true },
            { name: 'destination', type: 'string', required: true },
            { name: 'amount', type: 'uint', required: true },
            { name: 'counter', type: 'number', required: true },
            { name: 'fee', type: 'uint', required: true },
            { name: 'gas_limit', type: 'number', required: true },
            { name: 'storage_limit', type: 'number', required: true },
        ]);

        message = {
            ...message,
            transaction: {
                source: publicKeyHash2buffer(transaction.source).hash,
                destination: {
                    tag: publicKeyHash2buffer(transaction.destination).originated,
                    hash: publicKeyHash2buffer(transaction.destination).hash,
                },
                amount: transaction.amount,
                counter: transaction.counter,
                fee: transaction.fee,
                gas_limit: transaction.gas_limit,
                storage_limit: transaction.storage_limit,
            },
        };

        //  add parameters to transaction
        if (Object.prototype.hasOwnProperty.call(transaction, 'parameters')) {
            message = {
                ...message,
                transaction: {
                    ...message.transaction!, // we know message.transaction is not undefined anymore
                    parameters: transaction.parameters,
                },
            };
        }

        if (transaction.parameters_manager) {
            const { parameters_manager } = transaction;

            validateParams(parameters_manager, [
                { name: 'set_delegate', type: 'string', required: false },
                { name: 'cancel_delegate', type: 'boolean', required: false },
                { name: 'transfer', type: 'object', required: false },
            ]);

            if (parameters_manager.set_delegate) {
                message = {
                    ...message,
                    transaction: {
                        ...message.transaction!,
                        parameters_manager: {
                            set_delegate: publicKeyHash2buffer(parameters_manager.set_delegate)
                                .hash,
                        },
                    },
                };
            }

            if (Object.prototype.hasOwnProperty.call(parameters_manager, 'cancel_delegate')) {
                message = {
                    ...message,
                    transaction: {
                        ...message.transaction!,
                        parameters_manager: {
                            cancel_delegate: true,
                        },
                    },
                };
            }

            if (parameters_manager.transfer) {
                const { transfer } = parameters_manager;

                validateParams(transfer, [
                    { name: 'amount', type: 'uint', required: true },
                    { name: 'destination', type: 'string', required: true },
                ]);

                message = {
                    ...message,
                    transaction: {
                        ...message.transaction!,
                        parameters_manager: {
                            transfer: {
                                destination: {
                                    tag: publicKeyHash2buffer(transfer.destination).originated,
                                    hash: publicKeyHash2buffer(transfer.destination).hash,
                                },
                                amount: transfer.amount,
                            },
                        },
                    },
                };
            }
        }
    }

    // origination
    if (operation.origination) {
        const { origination } = operation;

        // validate origination parameters
        validateParams(origination, [
            { name: 'source', type: 'string', required: true },
            { name: 'balance', type: 'number', required: true },
            { name: 'fee', type: 'uint', required: true },
            { name: 'counter', type: 'number', required: true },
            { name: 'gas_limit', type: 'number', required: true },
            { name: 'storage_limit', type: 'number', required: true },
            { name: 'script', type: 'string', required: true },
        ]);

        message = {
            ...message,
            origination: {
                source: publicKeyHash2buffer(origination.source).hash,
                balance: origination.balance,
                fee: origination.fee,
                counter: origination.counter,
                gas_limit: origination.gas_limit,
                storage_limit: origination.storage_limit,
                script: origination.script,
            },
        };

        if (origination.delegate) {
            message = {
                ...message,
                origination: {
                    ...message.origination!,
                    delegate: publicKeyHash2buffer(origination.delegate).hash,
                },
            };
        }
    }

    // delegation
    if (operation.delegation) {
        const { delegation } = operation;

        // validate delegation parameters
        validateParams(delegation, [
            { name: 'source', type: 'string', required: true },
            { name: 'delegate', type: 'string', required: true },
            { name: 'fee', type: 'uint', required: true },
            { name: 'counter', type: 'number', required: true },
            { name: 'gas_limit', type: 'number', required: true },
            { name: 'storage_limit', type: 'number', required: true },
        ]);

        message = {
            ...message,
            delegation: {
                source: publicKeyHash2buffer(delegation.source).hash,
                delegate: publicKeyHash2buffer(delegation.delegate).hash,
                fee: delegation.fee,
                counter: delegation.counter,
                gas_limit: delegation.gas_limit,
                storage_limit: delegation.storage_limit,
            },
        };
    }

    return message;
};
