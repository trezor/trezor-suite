import { Output } from './output';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import {
    FeeLevel as FeeLevelBase,
    PrecomposedTransaction as PrecomposedBitcoinTransaction,
} from 'trezor-connect';
import { PrecomposedTransactionXrp } from './transactions';

export interface FeeLevel extends FeeLevelBase {
    value: string;
}

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
}

interface NetworkTypeEthereum {
    transactionInfo: any | null;
    gasLimit: {
        value: null | string;
        error: null;
    };
    gasPrice: {
        value: null | string;
        error: null;
    };
    data: {
        value: null | string;
        error: null;
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
