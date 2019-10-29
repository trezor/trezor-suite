import {
    FeeLevel as FeeLevelBase,
    PrecomposedTransaction as PrecomposedBitcoinTransaction,
} from 'trezor-connect';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';

export interface FeeLevel extends FeeLevelBase {
    value: string;
}
export interface FeeInfo {
    blockHeight: number; // when fee info was updated; 0 = never
    blockTime: number; // how often block is mined
    minFee: number;
    maxFee: number;
    feeLimit?: number; // eth gas limit
    levels: FeeLevel[]; // fee levels are predefined in trezor-connect > trezor-firmware/common
}

export interface Output {
    id: number;
    address: {
        value: null | string;
        error: null | typeof VALIDATION_ERRORS.IS_EMPTY | typeof VALIDATION_ERRORS.NOT_VALID;
    };
    amount: {
        value: null | string;
        error:
            | null
            | typeof VALIDATION_ERRORS.IS_EMPTY
            | typeof VALIDATION_ERRORS.NOT_NUMBER
            | typeof VALIDATION_ERRORS.NOT_ENOUGH
            | typeof VALIDATION_ERRORS.NOT_IN_RANGE_DECIMALS;
    };
    fiatValue: { value: null | string };
    localCurrency: {
        value: { value: string; label: string };
    };
}

export interface State {
    deviceState: string;
    outputs: Output[];
    isComposing: boolean;
    feeInfo: FeeInfo;
    selectedFee: FeeLevel;
    customFee: {
        value: null | string;
        error:
            | null
            | typeof VALIDATION_ERRORS.IS_EMPTY
            | typeof VALIDATION_ERRORS.NOT_NUMBER
            | typeof VALIDATION_ERRORS.NOT_IN_RANGE;
    };
    isAdditionalFormVisible: boolean;
    networkTypeRipple: {
        destinationTag: {
            value: null | string;
            error: null | typeof VALIDATION_ERRORS.NOT_NUMBER;
        };
    };
    networkTypeEthereum: {
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
    };
    networkTypeBitcoin: {
        transactionInfo: PrecomposedBitcoinTransaction | null;
    };
}

export type InitialState = {
    feeInfo: FeeInfo;
    selectedFee: FeeLevel;
} & Partial<State>;
