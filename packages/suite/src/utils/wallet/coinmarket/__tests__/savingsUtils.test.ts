import { CustomPaymentAmountKey } from '@wallet-constants/coinmarket/savings';
import {
    calculateAnnualSavings,
    getFiatAmountEffective,
    getPaymentFrequencyOptions,
    getStatusMessage,
} from '../savingsUtils';
import { FIAT_RATES, SELECTED_PROVIDER } from '../__fixtures__/savingsUtils';

describe('coinmarket/savings utils', () => {
    it('getStatusMessage', () => {
        expect(getStatusMessage('Blocked')).toBe('TR_SAVINGS_STATUS_ERROR');
        expect(getStatusMessage('Cancelled')).toBe('TR_SAVINGS_STATUS_ERROR');
        expect(getStatusMessage('InProgress')).toBe('TR_SAVINGS_STATUS_PENDING');
        expect(getStatusMessage('Pending')).toBe('TR_SAVINGS_STATUS_PENDING');
        expect(getStatusMessage('Error')).toBe('TR_SAVINGS_STATUS_ERROR');
        expect(getStatusMessage('Completed')).toBe('TR_SAVINGS_STATUS_SUCCESS');
    });
    it('getFiatAmountEffective', () => {
        expect(getFiatAmountEffective(undefined, undefined)).toBe('0');
        expect(getFiatAmountEffective('1', undefined)).toBe('1');
        expect(getFiatAmountEffective('1', '2')).toBe('1');
        expect(getFiatAmountEffective(CustomPaymentAmountKey, '2')).toBe('2');
        expect(getFiatAmountEffective(CustomPaymentAmountKey, 'FAKE')).toBe('0');
    });
    it('calculateAnnualSavings', () => {
        expect(calculateAnnualSavings('Weekly', '100', undefined, 'usd', FIAT_RATES)).toStrictEqual(
            {
                annualSavingsFiatAmount: 5200,
                annualSavingsCryptoAmount: '0.09572725',
            },
        );
        expect(
            calculateAnnualSavings('Biweekly', '100', undefined, 'usd', FIAT_RATES),
        ).toStrictEqual({
            annualSavingsFiatAmount: 2600,
            annualSavingsCryptoAmount: '0.04786363',
        });
        expect(
            calculateAnnualSavings('Monthly', '100', undefined, 'usd', FIAT_RATES),
        ).toStrictEqual({
            annualSavingsFiatAmount: 1200,
            annualSavingsCryptoAmount: '0.0220909',
        });
        expect(
            calculateAnnualSavings('Quarterly', '100', undefined, 'usd', FIAT_RATES),
        ).toStrictEqual({
            annualSavingsFiatAmount: 400,
            annualSavingsCryptoAmount: '0.00736363',
        });

        expect(
            calculateAnnualSavings('Weekly', '1234', undefined, 'fake', FIAT_RATES),
        ).toStrictEqual({
            annualSavingsFiatAmount: 0,
            annualSavingsCryptoAmount: '0',
        });
        expect(
            calculateAnnualSavings(undefined, undefined, undefined, undefined, FIAT_RATES),
        ).toStrictEqual({
            annualSavingsFiatAmount: 0,
            annualSavingsCryptoAmount: '0',
        });
    });
    it('getPaymentFrequencyOptions', () => {
        expect(getPaymentFrequencyOptions(undefined)).toStrictEqual([]);
        expect(
            getPaymentFrequencyOptions({
                ...SELECTED_PROVIDER,
                setupPaymentFrequencies: ['Weekly', 'Biweekly', 'Monthly', 'Quarterly'],
            }),
        ).toStrictEqual([
            { label: 'Weekly', value: 'Weekly' },
            { label: 'Biweekly', value: 'Biweekly' },
            { label: 'Monthly', value: 'Monthly' },
            { label: 'Quarterly', value: 'Quarterly' },
        ]);
    });
});
