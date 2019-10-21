import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';

interface Amount {
    value: null | string;
    error:
        | null
        | typeof VALIDATION_ERRORS.IS_EMPTY
        | typeof VALIDATION_ERRORS.NOT_NUMBER
        | typeof VALIDATION_ERRORS.NOT_ENOUGH
        | typeof VALIDATION_ERRORS.NOT_IN_RANGE_DECIMALS;
}

interface Address {
    value: null | string;
    error: null | typeof VALIDATION_ERRORS.IS_EMPTY | typeof VALIDATION_ERRORS.NOT_VALID;
}

interface FiatValue {
    value: null | string;
}

interface LocalCurrency {
    value: { value: string; label: string };
}

export interface Output {
    id: number;
    address: Address;
    amount: Amount;
    fiatValue: FiatValue;
    localCurrency: LocalCurrency;
}
