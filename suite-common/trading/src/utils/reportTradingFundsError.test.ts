import { captureException, withScope } from '@sentry/core';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type FeeInfo,
    type FormState,
    type PrecomposedLevels,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';

import { getTradingFundsErrorReport, reportTradingFundsError } from './reportTradingFundsError';

jest.mock('@sentry/core', () => ({
    captureException: jest.fn(),
    withScope: jest.fn(),
}));

const setTag = jest.fn();

const getTags = (): Record<string, unknown> => Object.fromEntries(setTag.mock.calls);

const account: Pick<Account, 'symbol' | 'accountType'> = {
    symbol: asNetworkSymbol('eth'),
    accountType: 'normal',
};

const composed: Pick<
    PrecomposedTransactionFinal,
    'feeLimit' | 'feePerByte' | 'max' | 'maxFeePerGas' | 'token'
> = {
    feeLimit: '450000',
    feePerByte: '2',
    maxFeePerGas: '2',
};

const feeInfo: Pick<FeeInfo, 'levels'> = {
    levels: [
        { label: 'normal', feePerUnit: '2', maxFeePerGas: '2', feeLimit: '21000', blocks: 2 },
        { label: 'high', feePerUnit: '4', maxFeePerGas: '4', feeLimit: '21000', blocks: 1 },
    ],
};

const formState: Pick<
    FormState,
    'ethereumAdjustGasLimit' | 'feeLimit' | 'feePerUnit' | 'maxFeePerGas'
> = {
    ethereumAdjustGasLimit: '1.25',
    feeLimit: '',
    feePerUnit: '',
};

const composedLevels: PrecomposedLevels = {
    normal: { type: 'error', error: 'AMOUNT_IS_NOT_ENOUGH' },
    low: {
        type: 'nonfinal',
        fee: '1',
        feePerByte: '2',
        feeLimit: '480000',
        max: undefined,
        bytes: 0,
        totalSpent: '1',
        inputs: [],
    },
};

const getReportParams = () =>
    getTradingFundsErrorReport({
        account,
        activeSection: 'exchange',
        composeError: 'AMOUNT_IS_NOT_ENOUGH',
        composed,
        composedLevels,
        feeInfo,
        formState,
        provider: 'lifi',
        selectedFee: 'normal',
    });

beforeEach(() => {
    jest.clearAllMocks();
    (withScope as jest.Mock).mockImplementation((callback: (scope: unknown) => void) =>
        callback({ setTag }),
    );
});

describe('getTradingFundsErrorReport', () => {
    it('reserves from the form snapshot and requires from a composed sibling level', () => {
        const report = getReportParams();

        expect(report.reserved).toEqual({ feeLimit: '450000', feePerGas: '2' });
        expect(report.required).toEqual({ feeLimit: '480000', feePerGas: '2' });
    });

    it('takes the required gas values from the form when a custom fee is selected', () => {
        const report = getTradingFundsErrorReport({
            account,
            activeSection: 'exchange',
            composeError: 'AMOUNT_IS_NOT_ENOUGH',
            composed,
            composedLevels,
            feeInfo,
            formState: { ...formState, feeLimit: '500000', feePerUnit: '3', maxFeePerGas: '3' },
            provider: 'lifi',
            selectedFee: 'custom',
        });

        expect(report.required).toEqual({ feeLimit: '500000', feePerGas: '3' });
    });

    it('flags a DEX trade of the whole balance', () => {
        const report = getTradingFundsErrorReport({
            account,
            activeSection: 'exchange',
            composeError: 'AMOUNT_IS_NOT_ENOUGH',
            composed: { ...composed, max: '1000000000000000000' },
            composedLevels,
            feeInfo,
            formState,
            provider: 'lifi',
            selectedFee: 'normal',
        });

        expect(report.isMaxAmount).toBe(true);
        expect(report.isDexTrade).toBe(true);
        expect(report.isTokenTrade).toBe(false);
    });

    it('carries no balance, amount or account descriptor', () => {
        const report = getTradingFundsErrorReport({
            account,
            activeSection: 'exchange',
            composeError: 'AMOUNT_IS_NOT_ENOUGH',
            composed: { ...composed, max: '1000000000000000000' },
            composedLevels,
            feeInfo,
            formState,
            provider: 'lifi',
            selectedFee: 'normal',
        });

        expect(JSON.stringify(report)).not.toContain('1000000000000000000');
        expect(Object.keys(report).sort()).toEqual([
            'accountType',
            'composeError',
            'isDexTrade',
            'isMaxAmount',
            'isTokenTrade',
            'provider',
            'required',
            'reserved',
            'selectedFee',
            'symbol',
            'tradeType',
        ]);
    });
});

describe('reportTradingFundsError', () => {
    it('reports how much more the confirm step required than the form reserved', () => {
        reportTradingFundsError(getReportParams());

        expect(getTags()['fee.requiredOverReserved']).toBe('1.0667');
        expect(getTags()['fee.feeLimitReserved']).toBe('450000');
        expect(getTags()['fee.feeLimitRequired']).toBe('480000');
        expect(getTags()['trade.provider']).toBe('lifi');
        expect(captureException).toHaveBeenCalledWith(
            new Error('Trading transaction rejected at confirm: AMOUNT_IS_NOT_ENOUGH'),
        );
    });

    it('marks the ratio unknown when the required gas limit is missing', () => {
        reportTradingFundsError({
            ...getReportParams(),
            required: { feeLimit: undefined, feePerGas: '2' },
        });

        expect(getTags()['fee.requiredOverReserved']).toBe('unknown');
        expect(getTags()['fee.feeLimitRequired']).toBe('unknown');
    });
});
