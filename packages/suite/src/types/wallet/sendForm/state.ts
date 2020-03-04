import { Output } from './output';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { FeeLevel, PrecomposedTransaction as PrecomposedBitcoinTransaction } from 'trezor-connect';
import { PrecomposedTransactionXrp } from './transactions';

export type InitialState = {
    feeInfo: FeeInfo;
    selectedFee: FeeLevel;
} & Partial<State>;

export interface FeeInfo {
    blockHeight: number; // when fee info was updated; 0 = never
    blockTime: number; // how often block is mined
    minFee: number;
    maxFee: number;
    feeLimit?: number; // eth gas limit
    levels: FeeLevel[]; // fee levels are predefined in trezor-connect > trezor-firmware/common
}

interface CustomFee {
    value: null | string;
    error:
        | null
        | typeof VALIDATION_ERRORS.IS_EMPTY
        | typeof VALIDATION_ERRORS.NOT_NUMBER
        | typeof VALIDATION_ERRORS.NOT_IN_RANGE;
}

interface NetworkTypeRipple {
    transactionInfo: PrecomposedTransactionXrp | null;
    destinationTag: {
        value: null | string;
        error: null | typeof VALIDATION_ERRORS.NOT_NUMBER | typeof VALIDATION_ERRORS.NOT_VALID;
    };
    isDestinationAccountEmpty: boolean | null;
}

interface NetworkTypeEthereum {
    transactionInfo: any | null;
    gasLimit: {
        value: null | string;
        error: null | typeof VALIDATION_ERRORS.NOT_NUMBER;
    };
    gasPrice: {
        value: null | string;
        error: null | typeof VALIDATION_ERRORS.NOT_NUMBER;
    };
    data: {
        value: null | string;
        error: null | typeof VALIDATION_ERRORS.NOT_HEX;
    };
}

interface NetworkTypeBitcoin {
    transactionInfo: PrecomposedBitcoinTransaction | null;
}

export interface State {
    deviceState: string;
    outputs: Output[];
    isComposing: boolean;
    feeInfo: FeeInfo;
    selectedFee: FeeLevel;
    customFee: CustomFee;
    isAdditionalFormVisible: boolean;
    networkTypeRipple: NetworkTypeRipple;
    networkTypeEthereum: NetworkTypeEthereum;
    networkTypeBitcoin: NetworkTypeBitcoin;
}
