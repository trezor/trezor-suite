// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/tx/outputs.js

import { ComposeOutput as ComposeOutputBase } from '@trezor/utxo-lib';
import { getOutputScriptType, fixPath, getHDPath } from '../../utils/pathUtils';
import { isValidAddress } from '../../utils/addressUtils';
import { convertMultisigPubKey } from '../../utils/hdnodeUtils';
import { validateParams } from '../common/paramsValidator';
import { PROTO, ERRORS } from '../../constants';
import type { BitcoinNetworkInfo, ProtoWithDerivationPath } from '../../types';
import type { ComposeOutput, ComposeResultFinal } from '../../types/api/composeTransaction';

/** *****
 * SignTransaction: validation
 ****** */
export const validateTrezorOutputs = (
    outputs: ProtoWithDerivationPath<PROTO.TxOutputType>[],
    coinInfo: BitcoinNetworkInfo,
): PROTO.TxOutputType[] => {
    const trezorOutputs = outputs
        .map(o => fixPath(o))
        .map(o => convertMultisigPubKey(coinInfo.network, o));

    trezorOutputs.forEach(output => {
        validateParams(output, [
            { name: 'address_n', type: 'array' },
            { name: 'address', type: 'string' },
            { name: 'amount', type: 'uint' },
            { name: 'op_return_data', type: 'string' },
            { name: 'multisig', type: 'object' },
        ]);

        if (
            Object.prototype.hasOwnProperty.call(output, 'address_n') &&
            Object.prototype.hasOwnProperty.call(output, 'address')
        ) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                'Cannot use address and address_n in one output',
            );
        }

        if (output.address_n && !output.script_type) {
            output.script_type = getOutputScriptType(output.address_n);
        }

        if (
            'address' in output &&
            typeof output.address === 'string' &&
            !isValidAddress(output.address, coinInfo)
        ) {
            // validate address with coin info
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                `Invalid ${coinInfo.label} output address ${output.address}`,
            );
        }
    });
    return trezorOutputs;
};

/** *****
 * ComposeTransaction: validation
 ****** */
export const validateHDOutput = (
    output: ComposeOutput,
    coinInfo: BitcoinNetworkInfo,
): ComposeOutputBase => {
    const validateAddress = (address?: string) => {
        if (!address || !isValidAddress(address, coinInfo)) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                `Invalid ${coinInfo.label} output address format`,
            );
        }
    };

    switch (output.type) {
        case 'opreturn':
            validateParams(output, [{ name: 'dataHex', type: 'string' }]);
            return {
                type: 'opreturn',
                dataHex: output.dataHex,
            };

        case 'send-max':
            validateParams(output, [{ name: 'address', type: 'string', required: true }]);
            validateAddress(output.address);
            return {
                type: 'send-max',
                address: output.address,
            };

        case 'payment-noaddress':
            validateParams(output, [{ name: 'amount', type: 'uint', required: true }]);
            return {
                type: 'payment-noaddress',
                amount: output.amount,
            };

        case 'send-max-noaddress':
            return {
                type: 'send-max-noaddress',
            };

        default:
            validateParams(output, [
                { name: 'amount', type: 'uint', required: true },
                { name: 'address', type: 'string', required: true },
            ]);
            validateAddress(output.address);
            return {
                type: 'payment',
                address: output.address,
                amount: output.amount,
            };
    }
};

/** *****
 * Transform the result of @trezor/utxo-lib `composeTx` to Trezor protobuf
 ****** */
export const outputToTrezor = (
    output: ComposeResultFinal['outputs'][number],
): PROTO.TxOutputType => {
    if (output.type === 'opreturn') {
        return {
            amount: '0',
            op_return_data: output.dataHex,
            script_type: 'PAYTOOPRETURN',
        };
    }

    if (output.type === 'change') {
        const address_n = getHDPath(output.path);
        return {
            address_n,
            amount: output.amount,
            script_type: getOutputScriptType(address_n),
        };
    }

    return {
        address: output.address,
        amount: output.amount,
        script_type: 'PAYTOADDRESS',
    };
};
