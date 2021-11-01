import { accumulative } from './inputs/accumulative';
import { bnb } from './inputs/bnb';
import { sortByScore, anyOf } from './utils';
import { tryConfirmed } from './tryconfirmed';

export type CoinSelectOptions = {
    inputLength: number;
    changeOutputLength: number;
    dustThreshold: number;
    own?: number;
    other?: number;
    coinbase?: number;
    baseFee?: number;
    floorBaseFee?: boolean;
    dustOutputFee?: number;
    skipPermutation?: boolean;
};

export type CoinSelectInput = {
    i: number;
    script: { length: number };
    value: string;
    confirmations: number;
    coinbase?: boolean;
    required?: boolean;
    own?: boolean;
};

export type CoinSelectOutput = {
    script: { length: number };
    value?: string;
};

export type CoinSelectOutputFinal = {
    script: { length: number };
    value: string;
};

export type CoinSelectResult =
    | {
          fee: number;
          inputs?: typeof undefined;
          outputs?: typeof undefined;
      }
    | {
          fee: number;
          inputs: CoinSelectInput[];
          outputs: CoinSelectOutputFinal[];
      };

export type CoinSelectAlgorithm = (
    inputs: CoinSelectInput[],
    outputs: CoinSelectOutput[],
    feeRate: number,
    options: CoinSelectOptions,
) => CoinSelectResult;

export function coinselect(
    inputs: CoinSelectInput[],
    outputs: CoinSelectOutput[],
    feeRate: number,
    options: CoinSelectOptions,
) {
    const sortedInputs = options.skipPermutation ? inputs : inputs.sort(sortByScore(feeRate));
    const algorithm = tryConfirmed(anyOf([bnb(0.5), accumulative]), options);
    return algorithm(sortedInputs, outputs, feeRate, options);
}
