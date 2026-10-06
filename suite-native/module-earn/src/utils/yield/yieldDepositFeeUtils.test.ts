import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type FeeInfo, type FormState } from '@suite-common/wallet-types';

import {
    buildYieldDepositFeeDraftState,
    buildYieldDepositFeeFormDraft,
    buildYieldDepositFeeLevels,
    buildYieldDepositFeePreview,
    buildYieldDepositSelectedFeeUnsignedTransaction,
} from './yieldDepositFeeUtils';

const baseUnsignedTransaction = {
    from: '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3',
    to: '0xbEef047a543E45807105E51A8BBEFCc5950fcfBa',
    data: '0x6e553f65',
    chainId: 1,
    gasLimit: '0x5208',
    nonce: 1,
    value: '0x0',
};

const buildFormDraft = (overrides: Partial<FormState>): FormState => ({
    outputs: [],
    selectedFee: 'normal',
    feePerUnit: '1',
    feeLimit: '21000',
    options: [],
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
    ...overrides,
});

const legacyFeeInfo: FeeInfo = {
    blockHeight: 0,
    blockTime: 0,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 0,
    levels: [
        {
            label: 'normal',
            feePerUnit: '1',
            blocks: 2,
        },
        {
            label: 'high',
            feePerUnit: '2',
            blocks: 1,
        },
    ],
};

const eip1559FeeInfo: FeeInfo = {
    blockHeight: 0,
    blockTime: 0,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 0,
    levels: [
        {
            label: 'normal',
            feePerUnit: '1',
            blocks: 2,
            baseFeePerGas: '0.5',
            maxFeePerGas: '1',
            maxPriorityFeePerGas: '0.5',
        },
        {
            label: 'high',
            feePerUnit: '2',
            blocks: 1,
            baseFeePerGas: '1',
            maxFeePerGas: '2',
            maxPriorityFeePerGas: '1',
        },
        {
            label: 'custom',
            feePerUnit: '3',
            blocks: 0,
        },
    ],
};

describe('buildYieldDepositFeePreview', () => {
    it('builds an EIP-1559 maximum fee preview from backend transaction', () => {
        const result = buildYieldDepositFeePreview(
            JSON.stringify({
                ...baseUnsignedTransaction,
                type: 2,
                maxFeePerGas: '0x3b9aca00',
                maxPriorityFeePerGas: '0x1dcd6500',
            }),
        );

        expect(result).toMatchObject({
            type: 'final',
            fee: '21000000000000',
            feePerByte: '1',
            feeLimit: '21000',
            maxFeePerGas: '1',
            maxPriorityFeePerGas: '0.5',
        });
    });

    it('builds a legacy gas price fee preview from backend transaction', () => {
        const result = buildYieldDepositFeePreview(
            JSON.stringify({
                ...baseUnsignedTransaction,
                gasPrice: '0x59682f00',
            }),
        );

        expect(result).toMatchObject({
            type: 'final',
            fee: '31500000000000',
            feePerByte: '1.5',
            feeLimit: '21000',
        });
    });

    it('returns null for unsupported unsigned transaction payload', () => {
        expect(buildYieldDepositFeePreview('not-json')).toBeNull();
    });

    it('returns null when the backend transaction has no fee fields', () => {
        expect(buildYieldDepositFeePreview(JSON.stringify(baseUnsignedTransaction))).toBeNull();
    });
});

describe('buildYieldDepositFeeLevels', () => {
    it('derives EIP-1559 fee levels from the base deposit transaction', () => {
        const result = buildYieldDepositFeeLevels({
            amount: '1.25',
            feeInfo: eip1559FeeInfo,
            gasLimit: '21000',
            symbol: 'eth' as NetworkSymbol,
            token: {
                contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                decimals: 6,
                symbol: 'USDC',
            },
            unsignedTransaction: JSON.stringify({
                ...baseUnsignedTransaction,
                type: 2,
                maxFeePerGas: '0x3b9aca00',
                maxPriorityFeePerGas: '0x1dcd6500',
            }),
        });

        expect(result.normal).toMatchObject({
            type: 'final',
            fee: '21000000000000',
            feePerByte: '1',
            feeLimit: '21000',
            maxFeePerGas: '1',
            maxPriorityFeePerGas: '0.5',
            outputs: [
                {
                    address: baseUnsignedTransaction.to,
                    amount: '1250000',
                },
            ],
        });
        expect(result.high).toMatchObject({
            type: 'final',
            fee: '42000000000000',
            feePerByte: '2',
            feeLimit: '21000',
            maxFeePerGas: '2',
            maxPriorityFeePerGas: '1',
        });
        expect(result.custom).toBeUndefined();
    });
});

describe('buildYieldDepositSelectedFeeUnsignedTransaction', () => {
    it('updates legacy fee fields without changing non-fee transaction fields', () => {
        const result = buildYieldDepositSelectedFeeUnsignedTransaction({
            feeInfo: legacyFeeInfo,
            currentFormDraft: buildFormDraft({ selectedFee: 'high' }),
            unsignedTransaction: JSON.stringify({
                ...baseUnsignedTransaction,
                gasPrice: '0x3b9aca00',
                baseFeePerGas: '0x0',
            }),
        });

        expect(result ? JSON.parse(result) : null).toEqual({
            ...baseUnsignedTransaction,
            gasLimit: '0x5208',
            gasPrice: '0x77359400',
        });
    });

    it('rebuilds a custom EIP-1559 fee and removes legacy fee fields', () => {
        const result = buildYieldDepositSelectedFeeUnsignedTransaction({
            feeInfo: eip1559FeeInfo,
            currentFormDraft: buildFormDraft({
                selectedFee: 'custom',
                feePerUnit: '7',
                feeLimit: '30000',
                maxFeePerGas: '8',
                maxPriorityFeePerGas: '2',
            }),
            unsignedTransaction: JSON.stringify({
                ...baseUnsignedTransaction,
                gasPrice: '0x3b9aca00',
            }),
        });
        const parsedResult = result ? JSON.parse(result) : null;

        expect(parsedResult).toEqual({
            ...baseUnsignedTransaction,
            type: 2,
            gasLimit: '0x7530',
            maxFeePerGas: '0x1dcd65000',
            maxPriorityFeePerGas: '0x77359400',
        });
        expect(parsedResult).not.toHaveProperty('gasPrice');
        expect(parsedResult).not.toHaveProperty('baseFeePerGas');
    });

    it('falls back from incomplete custom fee to normal and removes EIP-1559 fee fields', () => {
        const result = buildYieldDepositSelectedFeeUnsignedTransaction({
            feeInfo: legacyFeeInfo,
            currentFormDraft: buildFormDraft({
                selectedFee: 'custom',
                feePerUnit: '7',
                feeLimit: '',
            }),
            unsignedTransaction: JSON.stringify({
                ...baseUnsignedTransaction,
                type: 2,
                gasLimit: '0x7530',
                maxFeePerGas: '0x1dcd65000',
                maxPriorityFeePerGas: '0x77359400',
            }),
        });
        const parsedResult = result ? JSON.parse(result) : null;

        expect(parsedResult).toEqual({
            ...baseUnsignedTransaction,
            gasLimit: '0x7530',
            gasPrice: '0x3b9aca00',
        });
        expect(parsedResult).not.toHaveProperty('type');
        expect(parsedResult).not.toHaveProperty('maxFeePerGas');
        expect(parsedResult).not.toHaveProperty('maxPriorityFeePerGas');
    });

    it('falls back from partial EIP-1559 custom fee to normal EIP-1559 fee', () => {
        const result = buildYieldDepositSelectedFeeUnsignedTransaction({
            feeInfo: eip1559FeeInfo,
            currentFormDraft: buildFormDraft({
                selectedFee: 'custom',
                feePerUnit: '7',
                feeLimit: '30000',
                maxFeePerGas: '8',
            }),
            unsignedTransaction: JSON.stringify({
                ...baseUnsignedTransaction,
                type: 2,
                maxFeePerGas: '0x1dcd65000',
                maxPriorityFeePerGas: '0x77359400',
            }),
        });
        const parsedResult = result ? JSON.parse(result) : null;

        expect(parsedResult).toEqual({
            ...baseUnsignedTransaction,
            type: 2,
            gasLimit: '0x5208',
            maxFeePerGas: '0x3b9aca00',
            maxPriorityFeePerGas: '0x1dcd6500',
        });
        expect(parsedResult).not.toHaveProperty('gasPrice');
    });

    it('returns null for unsupported unsigned transaction payload', () => {
        expect(
            buildYieldDepositSelectedFeeUnsignedTransaction({
                feeInfo: legacyFeeInfo,
                unsignedTransaction: 'not-json',
            }),
        ).toBeNull();
    });
});

describe('buildYieldDepositFeeFormDraft', () => {
    const formState: FormState = {
        outputs: [],
        selectedFee: 'normal',
        feePerUnit: '1',
        feeLimit: '21000',
        maxFeePerGas: '1',
        maxPriorityFeePerGas: '0.5',
        options: [],
        isCoinControlEnabled: false,
        hasCoinControlBeenOpened: false,
        selectedUtxos: [],
    };

    it('preserves existing custom EIP-1559 fee fields', () => {
        const currentFormDraft: FormState = {
            outputs: [],
            selectedFee: 'custom',
            feePerUnit: '7',
            feeLimit: '30000',
            maxFeePerGas: '8',
            maxPriorityFeePerGas: '2',
            options: [],
            isCoinControlEnabled: false,
            hasCoinControlBeenOpened: false,
            selectedUtxos: [],
        };

        expect(
            buildYieldDepositFeeFormDraft({
                currentFormDraft,
                formState,
                selectedFee: 'custom',
            }),
        ).toMatchObject({
            selectedFee: 'custom',
            feePerUnit: '7',
            feeLimit: '30000',
            maxFeePerGas: '8',
            maxPriorityFeePerGas: '2',
        });
    });
});

describe('buildYieldDepositFeeDraftState', () => {
    it('adds a custom fee level when the custom fee draft is complete', () => {
        const result = buildYieldDepositFeeDraftState({
            amount: '1.25',
            currentFormDraft: buildFormDraft({
                selectedFee: 'custom',
                feePerUnit: '7',
                feeLimit: '30000',
                maxFeePerGas: '8',
                maxPriorityFeePerGas: '2',
            }),
            feeInfo: eip1559FeeInfo,
            gasLimit: '21000',
            symbol: 'eth' as NetworkSymbol,
            token: {
                contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                decimals: 6,
                symbol: 'USDC',
            },
            unsignedTransaction: JSON.stringify({
                ...baseUnsignedTransaction,
                type: 2,
                maxFeePerGas: '0x3b9aca00',
                maxPriorityFeePerGas: '0x1dcd6500',
            }),
        });

        expect(result?.formDraft.selectedFee).toBe('custom');
        expect(result?.feeLevels.custom).toMatchObject({
            type: 'final',
            fee: '240000000000000',
            feeLimit: '30000',
            feePerByte: '8',
            maxFeePerGas: '8',
            maxPriorityFeePerGas: '2',
        });
    });
});
