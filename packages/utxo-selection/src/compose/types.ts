import {
    type CoinSelectPaymentType,
    type TransactionInputOutputSortingStrategy,
} from '../coinselect/types';

export type ComposeInput = {
    vout: number;
    txid: string;
    amount: string;
    coinbase: boolean;
    own: boolean;
    confirmations: number;
    required?: boolean;
};

export type ComposeOutputPayment = { type: 'payment'; address: string; amount: string };
export type ComposeOutputPaymentNoAddress = { type: 'payment-noaddress'; amount: string };
export type ComposeOutputSendMax = { type: 'send-max'; address: string; amount?: string };
export type ComposeOutputSendMaxNoAddress = {
    type: 'send-max-noaddress';
    amount?: never;
};
export type ComposeOutputOpreturn = {
    type: 'opreturn';
    dataHex: string;
    amount?: never;
    address?: never;
};
export type ComposeOutputChange = { type: 'change'; amount: string };

export type ComposeFinalOutput =
    | ComposeOutputPayment
    | ComposeOutputSendMax
    | ComposeOutputOpreturn;
export type ComposeNotFinalOutput = ComposeOutputPaymentNoAddress | ComposeOutputSendMaxNoAddress;
export type ComposeOutput = ComposeFinalOutput | ComposeNotFinalOutput;

export type ComposeChangeAddress = { address: string };

export type ComposeRequest<
    Input extends ComposeInput,
    Output extends ComposeOutput,
    Change extends ComposeChangeAddress,
> = {
    txType?: CoinSelectPaymentType;
    utxos: Input[];
    outputs: Output[];
    feeRate: string | number;
    longTermFeeRate?: string | number;
    changeAddress: Change;
    dustThreshold: number;
    baseFee?: number;
    floorBaseFee?: boolean;
    skipUtxoSelection?: boolean;
    sortingStrategy: TransactionInputOutputSortingStrategy;
    feePolicy?: 'bitcoin' | 'doge' | 'zcash';
    toOutputScript: (address: string) => { length: number };
    toOpReturnScript: (dataHex: string) => { length: number };
};

type ComposedTransactionOutputs<T> = T extends ComposeOutputSendMax
    ? Omit<T, 'type'> & ComposeOutputPayment
    : T extends ComposeFinalOutput
      ? T
      : never;

export type ComposedTransaction<
    Input extends ComposeInput,
    Output extends ComposeOutput,
    Change extends ComposeChangeAddress,
> = {
    inputs: Input[];
    outputs: (ComposedTransactionOutputs<Output> | (Change & ComposeOutputChange))[];
    outputsPermutation: number[];
};

export const COMPOSE_ERROR_TYPES = [
    'MISSING-UTXOS',
    'MISSING-OUTPUTS',
    'INCORRECT-FEE-RATE',
    'NOT-ENOUGH-FUNDS',
] as const;

export type ComposeResultError =
    | { type: 'error'; error: (typeof COMPOSE_ERROR_TYPES)[number] }
    | {
          type: 'error';
          error: 'INCORRECT-UTXO' | 'INCORRECT-OUTPUT' | 'COINSELECT';
          message: string;
      };

export type ComposeResultNonFinal<Input extends ComposeInput> = {
    type: 'nonfinal';
    max?: string;
    totalSpent: string;
    fee: string;
    feePerByte: string;
    bytes: number;
    inputs: Input[];
};

export type ComposeResultFinal<
    Input extends ComposeInput,
    Output extends ComposeOutput,
    Change extends ComposeChangeAddress,
> = ComposedTransaction<Input, Output, Change> & {
    type: 'final';
    max?: string;
    totalSpent: string;
    fee: string;
    feePerByte: string;
    bytes: number;
    inputs: Input[];
    outputs: (ComposedTransactionOutputs<Output> | (Change & ComposeOutputChange))[];
    outputsPermutation: number[];
};

export type ComposeResult<
    Input extends ComposeInput,
    Output extends ComposeOutput,
    Change extends ComposeChangeAddress,
> = ComposeResultError | ComposeResultNonFinal<Input> | ComposeResultFinal<Input, Output, Change>;

export type { TransactionInputOutputSortingStrategy } from '../coinselect/types';
