export type CoinSelectPaymentType = 'p2pkh' | 'p2sh' | 'p2tr' | 'p2wpkh' | 'p2wsh';

export interface CoinSelectOptions {
    txType: CoinSelectPaymentType;
    changeOutput?: CoinSelectOutput;
    dustThreshold?: number;
    longTermFeeRate?: number;
    own?: number;
    other?: number;
    coinbase?: number;
    baseFee?: number;
    floorBaseFee?: boolean;
    skipPermutation?: boolean;
    feePolicy?: 'bitcoin' | 'doge' | 'zcash';
}

export interface CoinSelectInput {
    type: CoinSelectPaymentType;
    i: number;
    script: { length: number };
    value: string;
    confirmations: number;
    coinbase?: boolean;
    required?: boolean;
    own?: boolean;
    weight?: number;
}

export interface CoinSelectOutput {
    script: { length: number };
    value?: string;
    weight?: number;
}

export interface CoinSelectOutputFinal {
    script: { length: number };
    value: string;
}

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

export interface CoinSelectSuccess {
    success: true;
    payload: {
        inputs: CoinSelectInput[];
        outputs: CoinSelectOutputFinal[];
        max?: string;
        totalSpent: string;
        fee: number;
        feePerByte: number;
        bytes: number;
    };
}

export interface CoinSelectFailure {
    success: false;
}
