import * as BitcoinJsAddress from './address';
import { transactionBytes, INPUT_SCRIPT_LENGTH } from './coinselect/coinselectUtils';
import { getAddressType } from './address';
import type { Network } from './networks';

const isKnownInputAddress = (type: string): type is keyof typeof INPUT_SCRIPT_LENGTH =>
    type in INPUT_SCRIPT_LENGTH;

const toVin = (network: Network) => (address: string) => {
    const type = getAddressType(address, network);
    if (isKnownInputAddress(type)) {
        return {
            type,
            script: { length: INPUT_SCRIPT_LENGTH[type] },
        } as const;
    }
    throw new Error(`Unknown input address '${address}'`);
};

const toVout = (network: Network) => (address: string) => {
    let length;
    try {
        length = BitcoinJsAddress.toOutputScript(address, network).length;
    } catch {
        const msg = address.match(/^OP_RETURN (.*)$/)?.pop();
        if (msg) {
            length = msg.match(/^\(.*\)$/)
                ? msg.length // ascii
                : 2 + msg.length / 2; // hex
        } else {
            // unknown output address
            length = 0;
        }
    }

    return { script: { length } };
};

export const getTransactionVbytesFromAddresses = (
    inputs: string[],
    outputs: string[],
    network: Network,
) => {
    const ins = inputs.map(toVin(network));
    const outs = outputs.map(toVout(network));
    return transactionBytes(ins, outs);
};

type GetTransactionVbytesParam = {
    vin: { addresses?: string[] }[];
    vout: { addresses?: string[] }[];
};

export const getTransactionVbytes = (
    { vin, vout }: GetTransactionVbytesParam,
    network: Network,
) => {
    const ins = vin.map(({ addresses = [] }) => addresses[0] ?? '');

    // Blockbook sometimes cannot parse any address from output
    // e.g. https://tbtc1.trezor.io/tx/904f2c2dabc95c504d758d683a00110b324c2bb3caa8163019495fc0d0a82c42
    const outs = vout.map(({ addresses = [] }) => addresses[0] ?? '');

    return getTransactionVbytesFromAddresses(ins, outs, network);
};
