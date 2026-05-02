import { PrecomposedTransaction } from '@suite-common/wallet-types';
import { FeeLevel, TokenInfo } from '@trezor/connect';

interface BuildAllowanceTransactionFixture {
    description: string;
    input: {
        balance: string;
        contract: string;
        feeLevel: FeeLevel;
        networkDisplaySymbol: string;
        token?: TokenInfo;
        estimatedFeeLimit?: string;
    };
    result: PrecomposedTransaction;
}

export const buildAllowanceTransaction: BuildAllowanceTransactionFixture[] = [
    {
        description: 'Balance sufficient, returns final transaction',
        input: {
            balance: '1000000000000000000',
            contract: '0x1234567890abcdef1234567890abcdef12345678',
            feeLevel: {
                label: 'normal',
                feePerUnit: '10',
                feeLimit: '50000',
                blocks: -1,
            },
            networkDisplaySymbol: 'ETH',
        },
        result: {
            type: 'final',
            totalSpent: '0',
            fee: '500000000000000',
            feePerByte: '10',
            feeLimit: '50000',
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            estimatedFeeLimit: undefined,
            token: undefined,
            bytes: 0,
            inputs: [],
            outputsPermutation: [0],
            outputs: [
                {
                    address: '0x1234567890abcdef1234567890abcdef12345678',
                    amount: '0',
                    script_type: 'PAYTOADDRESS',
                },
            ],
        },
    },
    {
        description: 'Insufficient balance, returns error',
        input: {
            balance: '100000000000000',
            contract: '0x1234567890abcdef1234567890abcdef12345678',
            feeLevel: {
                label: 'normal',
                feePerUnit: '10',
                feeLimit: '50000',
                blocks: -1,
            },
            networkDisplaySymbol: 'ETH',
        },
        result: {
            type: 'error',
            error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
            errorMessage: {
                id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
                values: {
                    feeAmount: '0.0005',
                    networkDisplaySymbol: 'ETH',
                },
            },
        },
    },
];
