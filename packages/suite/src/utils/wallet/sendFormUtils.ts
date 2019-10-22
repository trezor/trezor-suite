import { Output } from '@wallet-types/sendForm';
import BigNumber from 'bignumber.js';

export const getOutput = (outputs: Output[], id: number) =>
    outputs.find(outputItem => outputItem.id === id) as Output;

export const hasDecimals = (value: string, decimals: number) => {
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
        if (output[name].value) {
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

export const calculateTotal = (amount: string, fee: string): string => {
    try {
        const bAmount = new BigNumber(amount);
        if (bAmount.isNaN()) {
            console.error('Amount is not a number');
        }
        return bAmount.plus(fee).toFixed();
    } catch (error) {
        // TODO: empty input throws this error.
        return '0';
    }
};

export const calculateMaxAmount = (balance: BigNumber, fee: string): string => {
    try {
        // TODO - minus pendings
        const max = balance.minus(fee);
        if (max.isLessThan(0)) return '0';
        return max.toFixed();
    } catch (error) {
        console.error(error);
        return '0';
    }
};
