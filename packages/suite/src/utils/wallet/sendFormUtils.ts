import { Output } from '@wallet-types/sendForm';
import { NETWORKS } from '@wallet-config';
import { Account } from '@wallet-types';

export const getOutput = (outputs: Output[], id: number) =>
    outputs.find(outputItem => outputItem.id === id) as Output;

export const hasDecimals = (value: string, symbol: Account['symbol']) => {
    const network = NETWORKS.find(n => n.symbol === symbol);
    if (!network) return false;
    const { decimals } = network;

    const DECIMALS_REGEX = new RegExp(
        `^(0|0\\.([0-9]{0,${decimals}})?|[1-9][0-9]*\\.?([0-9]{0,${decimals}})?)$`,
    );
    return DECIMALS_REGEX.test(value);
};

export const shouldComposeByAddress = (outputs: Output[]) => {
    let shouldCompose = true;
    const addresses = [];

    // check if there is at least one address
    outputs.forEach(output => {
        if (output.address.value) {
            addresses.push(output.address.value);
        }
    });

    if (addresses.length === 0) {
        shouldCompose = false;
    }

    // one of the addresses is not valid
    outputs.forEach(output => {
        if (output.address.error) {
            shouldCompose = false;
        }
    });

    return shouldCompose;
};
