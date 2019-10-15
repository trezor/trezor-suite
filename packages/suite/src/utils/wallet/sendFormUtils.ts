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
