// This class is a 1:1 copy of trezor-firmware tx weight calculation.
// It is used to verify that compose process returns correct values in estimated tx virtual bytes.
// multisig and external is not used for now in therefore its not 100% done.
// https://github.com/trezor/trezor-firmware/blob/1fceca73da523c5bf2bb0f398c91e00c728bdbe0/core/src/apps/bitcoin/sign_tx/tx_weight.py
// https://github.com/trezor/trezor-firmware/blob/1fceca73da523c5bf2bb0f398c91e00c728bdbe0/core/tests/test_apps.bitcoin.txweight.py

import {
    CoinSelectPaymentType,
    ComposeChangeAddress,
    ComposeInput,
    ComposeOutput,
    ComposeResultFinal,
    Network,
} from '../src';
import * as baddress from '../src/address';
import { TxWeightCalculator } from '../src/txWeightCalculator';

export function verifyTxBytes(
    tx: ComposeResultFinal<ComposeInput, ComposeOutput, ComposeChangeAddress>,
    txType: Exclude<CoinSelectPaymentType, 'p2wsh'> = 'p2pkh',
    network?: Network,
) {
    const calc = new TxWeightCalculator();
    tx.inputs.forEach(() => {
        calc.addInputByKey(txType);
    });

    tx.outputs.forEach(out => {
        if (out.type === 'opreturn') {
            calc.addOutput({ length: 2 + out.dataHex.length / 2 });
        }
        if (out.type === 'payment') {
            calc.addOutput({ length: baddress.toOutputScript(out.address, network).length });
        }
        if (out.type === 'change') {
            calc.addOutputByKey(txType); // change output
        }
    });

    expect(calc.getVirtualBytes()).toEqual(tx.bytes);
}
