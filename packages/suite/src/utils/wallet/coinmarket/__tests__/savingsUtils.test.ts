import { Translation } from 'src/components/suite/Translation';
import { CustomPaymentAmountKey } from 'src/constants/wallet/coinmarket/savings';
import {
    calculateAnnualSavings,
    getFiatAmountEffective,
    getPaymentFrequencyOptions,
    getStatusMessage,
} from '../savingsUtils';
import { SELECTED_PROVIDER } from '../__fixtures__/savingsUtils';

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
        expect(calculateAnnualSavings('Daily', '100', undefined, 54321)).toStrictEqual({
            annualSavingsFiatAmount: 36500,
            annualSavingsCryptoAmount: '0.67193167',
        });
        expect(calculateAnnualSavings('Weekly', '100', undefined, 54321)).toStrictEqual({
            annualSavingsFiatAmount: 5200,
            annualSavingsCryptoAmount: '0.09572725',
        });
        expect(calculateAnnualSavings('Biweekly', '100', undefined, 54321)).toStrictEqual({
            annualSavingsFiatAmount: 2600,
            annualSavingsCryptoAmount: '0.04786363',
        });
        expect(calculateAnnualSavings('Monthly', '100', undefined, 54321)).toStrictEqual({
            annualSavingsFiatAmount: 1200,
            annualSavingsCryptoAmount: '0.0220909',
        });
        expect(calculateAnnualSavings('Quarterly', '100', undefined, 54321)).toStrictEqual({
            annualSavingsFiatAmount: 400,
            annualSavingsCryptoAmount: '0.00736363',
        });
        expect(calculateAnnualSavings(undefined, undefined, undefined, undefined)).toStrictEqual({
            annualSavingsFiatAmount: 0,
            annualSavingsCryptoAmount: '0',
        });
    });
    it('getPaymentFrequencyOptions', () => {
        expect(getPaymentFrequencyOptions(undefined)).toStrictEqual([]);
        expect(
            getPaymentFrequencyOptions({
                ...SELECTED_PROVIDER,
                setupPaymentFrequencies: ['Daily', 'Weekly', 'Biweekly', 'Monthly', 'Quarterly'],
            }),
        ).toStrictEqual([
            {
                label: Translation({ id: 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_DAILY' }),
                value: 'Daily',
            },
            {
                label: Translation({ id: 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_WEEKLY' }),
                value: 'Weekly',
            },
            {
                label: Translation({ id: 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_BIWEEKLY' }),
                value: 'Biweekly',
            },
            {
                label: Translation({ id: 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_MONTHLY' }),
                value: 'Monthly',
            },
            {
                label: Translation({ id: 'TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_QUARTERLY' }),
                value: 'Quarterly',
            },
        ]);
    });
});
