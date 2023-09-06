// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/tx/outputs.js

import type { ComposeOutput as UtxoLibOutput, ComposedTxOutput } from '@trezor/utxo-lib';
import { getOutputScriptType, fixPath } from '../../utils/pathUtils';
import { isValidAddress } from '../../utils/addressUtils';
import { convertMultisigPubKey } from '../../utils/hdnodeUtils';
import { validateParams } from '../common/paramsValidator';
import { PROTO, ERRORS } from '../../constants';
import type { BitcoinNetworkInfo, ProtoWithDerivationPath } from '../../types';
import type { ComposeOutput } from '../../types/api/composeTransaction';

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
): UtxoLibOutput => {
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
                dataHex: output.dataHex || '',
            };

        case 'send-max':
            validateParams(output, [{ name: 'address', type: 'string', required: true }]);
            validateAddress(output.address);
            return {
                type: 'send-max',
                address: output.address,
            };

        case 'noaddress':
            validateParams(output, [{ name: 'amount', type: 'uint', required: true }]);
            return {
                type: 'noaddress',
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
            // @ts-expect-error TODO: https://github.com/trezor/trezor-suite/issues/5297
            validateAddress(output.address);
            return {
                type: 'complete',
                // @ts-expect-error TODO: https://github.com/trezor/trezor-suite/issues/5297
                address: output.address,
                amount: output.amount,
            };
    }
};

/** *****
 * Transform from @trezor/utxo-lib format to Trezor
 ****** */
export const outputToTrezor = (
    output: ComposedTxOutput,
    _coinInfo: BitcoinNetworkInfo,
): PROTO.TxOutputType => {
    if (output.opReturnData) {
        if (output.value) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                'opReturn output should not contains value',
            );
        }
        return {
            amount: '0',
            op_return_data: output.opReturnData.toString('hex'),
            script_type: 'PAYTOOPRETURN',
        };
    }
    if (!output.address && !output.path) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            'Both address and path of an output cannot be null.',
        );
    }
    if (output.path) {
        return {
            address_n: output.path,
            amount: output.value,
            script_type: getOutputScriptType(output.path),
        };
    }

    const { address, value } = output;
    if (typeof address !== 'string') {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            'Wrong output address type, should be string',
        );
    }

    return {
        address,
        amount: value,
        script_type: 'PAYTOADDRESS',
    };
};
