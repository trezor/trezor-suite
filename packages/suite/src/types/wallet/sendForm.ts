import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';

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
            | typeof VALIDATION_ERRORS.NOT_ENOUGH;
    };
    fiatValue: { value: null | string };
    localCurrency: {
        value: { value: string; label: string };
    };
}

export interface State {
    outputs: Output[];
    fee: null | { value: string; label: string };
    customFee: {
        value: null | string;
        error: null | typeof VALIDATION_ERRORS.IS_EMPTY | typeof VALIDATION_ERRORS.NOT_NUMBER;
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
    networkTypeBitcoin: {};
}
