import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';

export const OUTPUTS = {
    BASIC: [
        {
            id: 1,
            address: { value: null, error: null },
            amount: { value: null, error: null, isLoading: false },
            fiatValue: { value: null },
            localCurrency: { value: { value: 'value', label: 'label' } },
        },
        {
            id: 2,
            address: { value: null, error: null },
            amount: { value: null, error: null, isLoading: false },
            fiatValue: { value: null },
            localCurrency: { value: { value: 'value', label: 'label' } },
        },
        {
            id: 3,
            address: { value: null, error: null },
            amount: { value: null, error: null, isLoading: false },
            fiatValue: { value: null },
            localCurrency: { value: { value: 'value', label: 'label' } },
        },
    ],
    NO_ERROR_ADDRESS: [
        {
            id: 1,
            address: { value: 'address', error: null },
            amount: { value: null, error: null, isLoading: false },
            fiatValue: { value: null },
            localCurrency: { value: { value: 'value', label: 'label' } },
        },
        {
            id: 2,
            address: { value: null, error: null },
            amount: { value: null, error: null, isLoading: false },
            fiatValue: { value: null },
            localCurrency: { value: { value: 'value', label: 'label' } },
        },
        {
            id: 3,
            address: { value: null, error: null },
            amount: { value: null, error: null, isLoading: false },
            fiatValue: { value: null },
            localCurrency: { value: { value: 'value', label: 'label' } },
        },
    ],
    NO_ERROR_AMOUNT: [
        {
            id: 1,
            address: { value: null, error: null },
            amount: { value: '1212', error: null, isLoading: false },
            fiatValue: { value: null },
            localCurrency: { value: { value: 'value', label: 'label' } },
        },
        {
            id: 2,
            address: { value: null, error: null },
            amount: { value: null, error: null, isLoading: false },
            fiatValue: { value: null },
            localCurrency: { value: { value: 'value', label: 'label' } },
        },
        {
            id: 3,
            address: { value: null, error: null },
            amount: { value: null, error: null, isLoading: false },
            fiatValue: { value: null },
            localCurrency: { value: { value: 'value', label: 'label' } },
        },
    ],
    ADDRESS_EMPTY: [
        {
            id: 1,
            address: { value: null, error: null },
            amount: { value: null, error: null, isLoading: false },
            fiatValue: { value: null },
            localCurrency: { value: { value: 'value', label: 'label' } },
        },
        {
            id: 2,
            address: { value: null, error: null },
            amount: { value: null, error: null, isLoading: false },
            fiatValue: { value: null },
            localCurrency: { value: { value: 'value', label: 'label' } },
        },
    ],
    ADDRESS_ERROR: [
        {
            id: 1,
            address: { value: null, error: null },
            amount: { value: null, error: null, isLoading: false },
            fiatValue: { value: null },
            localCurrency: { value: { value: 'value', label: 'label' } },
        },
        {
            id: 2,
            address: { value: null, error: VALIDATION_ERRORS.IS_EMPTY },
            amount: { value: null, error: null, isLoading: false },
            fiatValue: { value: null },
            localCurrency: { value: { value: 'value', label: 'label' } },
        },
    ],
    AMOUNT_ERROR: [
        {
            id: 1,
            address: { value: null, error: null },
            amount: { value: null, error: null, isLoading: false },
            fiatValue: { value: null },
            localCurrency: { value: { value: 'value', label: 'label' } },
        },
        {
            id: 2,
            address: { value: null, error: null },
            amount: { value: null, error: VALIDATION_ERRORS.IS_EMPTY, isLoading: false },
            fiatValue: { value: null },
            localCurrency: { value: { value: 'value', label: 'label' } },
        },
    ],
    AMOUNT_EMPTY: [
        {
            id: 1,
            address: { value: null, error: null },
            amount: { value: null, error: null, isLoading: false },
            fiatValue: { value: null },
            localCurrency: { value: { value: 'value', label: 'label' } },
        },
        {
            id: 2,
            address: { value: null, error: null },
            amount: { value: null, error: null, isLoading: false },
            fiatValue: { value: null },
            localCurrency: { value: { value: 'value', label: 'label' } },
        },
    ],
};
