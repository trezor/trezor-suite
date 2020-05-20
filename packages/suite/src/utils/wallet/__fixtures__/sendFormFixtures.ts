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

export const prepareEthereumTransaction = [
    {
        description: 'regular',
        txInfo: {
            to: '0xA',
            amount: '1',
            chainId: 1,
            nonce: '2',
            gasLimit: '21000',
            gasPrice: '1',
            data: 'deadbeef',
        },
        result: {
            to: '0xA',
            value: '0xde0b6b3a7640000',
            chainId: 1,
            nonce: '0x2',
            gasLimit: '0x5208',
            gasPrice: '0x3b9aca00',
            data: '0xdeadbeef',
        },
    },
];
