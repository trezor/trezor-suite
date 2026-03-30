import { type CoinSelectPaymentType, type TransactionInputOutputSortingStrategy } from '../types';

// UTXO == unspent transaction output = all I can spend
export type ComposeInput = {
    vout: number; // index of output IN THE TRANSACTION
    txid: string; // hash of the transaction
    amount: string; // how much money sent
    coinbase: boolean; // coinbase transaction = utxo from mining, cannot be spend before 100 blocks
    own: boolean; // is the ORIGIN me (the same account)
    confirmations: number; // might be spent immediately (own) or after 6 conf (not own) see ./coinselect/tryConfirmed
    required?: boolean; // must be included into transaction
};

// Output parameter of coinselect algorithm which is either:
//    - 'payment' - address and amount
//    - 'payment-noaddress' - just amount
//    - 'send-max' - address
//    - 'send-max-noaddress' - no other info
//    - 'opreturn' - dataHex
export type ComposeOutputPayment = {
    type: 'payment';
    address: string;
    amount: string;
};

export type ComposeOutputPaymentNoAddress = {
    type: 'payment-noaddress';
    amount: string;
};

export type ComposeOutputSendMax = {
    type: 'send-max'; // only one in TX request
    address: string;
    amount?: string;
};

export type ComposeOutputSendMaxNoAddress = {
    type: 'send-max-noaddress';
    amount?: typeof undefined;
};

export type ComposeOutputOpreturn = {
    type: 'opreturn'; // it doesn't need to have address
    dataHex: string;
    amount?: typeof undefined;
    address?: typeof undefined;
};

// NOTE: this type **is not** accepted by ComposeRequest['utxos']
// it's optionally created by the process from ComposeChangeAddress data
// but it's returned in ComposedTransaction['outputs']
export type ComposeOutputChange = {
    type: 'change';
    amount: string;
};

export type ComposeFinalOutput =
    | ComposeOutputPayment
    | ComposeOutputSendMax
    | ComposeOutputOpreturn;

export type ComposeNotFinalOutput = ComposeOutputPaymentNoAddress | ComposeOutputSendMaxNoAddress;

export type ComposeOutput = ComposeFinalOutput | ComposeNotFinalOutput;

export type ComposeChangeAddress = {
    address: string;
};

export type ComposeRequest<
    Input extends ComposeInput,
    Output extends ComposeOutput,
    Change extends ComposeChangeAddress,
> = {
    txType?: CoinSelectPaymentType;
    utxos: Input[]; // all inputs
    outputs: Output[]; // all outputs
    feeRate: string | number; // in sat/byte, virtual size
    longTermFeeRate?: string | number; // dust output feeRate multiplier in sat/byte, virtual size
    changeAddress: Change;
    dustThreshold: number; // explicit dust threshold, in satoshi
    baseFee?: number; // DOGE or RBF base fee
    floorBaseFee?: boolean; // DOGE floor base fee to the nearest integer
    skipUtxoSelection?: boolean; // use custom utxo selection, without algorithm
    sortingStrategy: TransactionInputOutputSortingStrategy;
    feePolicy?: 'bitcoin' | 'doge' | 'zcash';
    convertAddress: (address: string) => { length: number };
    convertOpReturn?: (dataHex: string) => { length: number };
};

type ComposedTransactionOutputs<T> = T extends ComposeOutputSendMax
    ? Omit<T, 'type'> & ComposeOutputPayment // NOTE: replace ComposeOutputSendMax (no amount) with ComposeOutputPayment (with amount)
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
    | {
          type: 'error';
          error: (typeof COMPOSE_ERROR_TYPES)[number];
      }
    | {
          type: 'error';
          error: 'INCORRECT-UTXO' | 'INCORRECT-OUTPUT' | 'COINSELECT';
          message: string;
      };

export type ComposeResultNonFinal<Input extends ComposeInput> = {
    type: 'nonfinal';
    max?: string;
    totalSpent: string; // all the outputs, no fee, no change
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
    totalSpent: string; // all the outputs, no fee, no change
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

// Re-export TransactionInputOutputSortingStrategy from coinselect types
export type { TransactionInputOutputSortingStrategy } from '../types';
