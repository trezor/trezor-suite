import { payments, Network } from '@trezor/utxo-lib';

import { AllowedScriptTypes } from '../types/coordinator';

// WabiSabi coordinator is using custom format of address scriptPubKey
// utxo-lib format: `OP_0 {sha256(redeemScript)}`, `OP_1 {witnessProgram}`
// wabisabi format: `0 hash`, `1 hash`
export const getScriptPubKeyFromAddress = (
    address: string,
    network: Network,
    scriptType: AllowedScriptTypes,
) => {
    if (scriptType === 'P2WPKH') {
        return `0 ${payments
            .p2wpkh({
                address,
                network,
            })
            .hash?.toString('hex')}`;
    }

    if (scriptType === 'Taproot') {
        // OP_1: 51
        return `1 ${payments
            .p2tr({
                address,
                network,
            })
            .hash?.toString('hex')}`;
    }

    throw new Error('Unsupported scriptType');
};

// check WabiSabi.scriptPubKey format by OP and return AllowedScriptType
export const getScriptTypeFromScriptPubKey = (scriptPubKey: string): AllowedScriptTypes => {
    if (scriptPubKey.startsWith('0 ')) {
        return 'P2WPKH';
    }
    if (scriptPubKey.startsWith('1 ')) {
        return 'Taproot';
    }

    throw new Error('Unsupported scriptType');
};

// return WabiSabi coordinator config constants
export const getInputSize = (type: AllowedScriptTypes) => {
    if (type === 'Taproot') return 58;
    if (type === 'P2WPKH') return 68;
    throw new Error('Unsupported scriptType');
};

// return WabiSabi coordinator config constants
export const getOutputSize = (type: AllowedScriptTypes) => {
    if (type === 'Taproot') return 43;
    if (type === 'P2WPKH') return 31;
    throw new Error('Unsupported scriptType');
};

export const getExternalOutputSize = (scriptPubKey: string) => {
    const type = getScriptTypeFromScriptPubKey(scriptPubKey);
    return getOutputSize(type);
};
