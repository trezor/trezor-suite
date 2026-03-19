import type { BitcoinNetworkInfo, PROTO } from '@trezor/connect-common';
import { TxWeightCalculator, address as baddress } from '@trezor/utxo-lib';

import { getOutputScriptType, getScriptType } from '../../utils/pathUtils';

export function mapOutputScriptToKey(script_type: string) {
    switch (script_type) {
        case 'PAYTOADDRESS':
            return 'p2pkh';
        case 'PAYTOSCRIPTHASH':
            return 'p2sh';
        case 'PAYTOWITNESS':
            return 'p2wpkh';
        case 'PAYTOP2SHWITNESS':
            return 'p2sh';
        case 'PAYTOTAPROOT':
            return 'p2tr';
        default:
            return undefined;
    }
}

export const getTransactionVbytes = (
    inputs: PROTO.TxInputType[],
    outputs: PROTO.TxOutputType[],
    coinInfo: BitcoinNetworkInfo,
) => {
    const calc = new TxWeightCalculator();
    let cannotProcess = false;
    inputs.forEach(input => {
        const script_type = input.script_type ?? getScriptType(input.address_n);
        if (script_type && !input.witness) {
            calc.addInput({
                script_type,
                multisig: input.multisig,
                ownership_proof: input.ownership_proof,
            });
        } else {
            cannotProcess = true;
        }
    });

    outputs.forEach(out => {
        if (out.script_type === 'PAYTOOPRETURN') {
            if (!out.op_return_data) {
                cannotProcess = true;

                return;
            }
            calc.addOutput({ length: 2 + out.op_return_data.length / 2 });

            return;
        } else if (out.address) {
            calc.addOutput({
                length: baddress.toOutputScript(out.address, coinInfo.network).length,
            });

            return;
        } else if (out.address_n || out.script_type) {
            const script_type = out.script_type ?? getOutputScriptType(out.address_n);
            if (script_type) {
                const script_key = mapOutputScriptToKey(script_type);
                if (script_key) {
                    calc.addOutputByKey(script_key);

                    return;
                }
            }
        }
        cannotProcess = true;
    });

    if (cannotProcess) {
        return undefined;
    }

    return calc.getVirtualBytes();
};
