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

export const shouldComposeBy = (name: 'address' | 'amount', outputs: Output[]) => {
    let shouldCompose = true;
    const results = [];

    // check if there is at least one filled
    outputs.forEach(output => {
        if (output.amount.value) {
            results.push(output[name].value);
        }
    });

    if (results.length === 0) {
        shouldCompose = false;
    }

    // one of the inputs is not valid
    outputs.forEach(output => {
        if (output[name].error) {
            shouldCompose = false;
        }
    });

    return shouldCompose;
};
