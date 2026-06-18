import type { ExchangeTrade } from 'invity-api';

import type { SlippageFormValues } from '@suite-common/trading';
import { yup } from '@suite-common/validators';
import { Form, useForm } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { mercuryoDexQuote } from '@suite-native/trading-fixtures';

import { renderWithSlippageTestProvider } from '../../__tests__/testUtils';
import { SlippageSummary } from '../SlippageSummary';

const validationSchema = yup.object({ slippage: yup.string() });

const TestWrapper = ({ slippage = '1' }: { slippage?: string }) => {
    const form = useForm<SlippageFormValues>({
        defaultValues: { slippage },
        validation: validationSchema,
    });

    return (
        <Form form={form}>
            <SlippageSummary />
        </Form>
    );
};

const renderSlippageSummary = (slippage?: string, quote?: ExchangeTrade) =>
    renderWithSlippageTestProvider(<TestWrapper slippage={slippage} />, { quote });

describe('SlippageSummary', () => {
    it('should render all row labels', () => {
        const { getByText } = renderSlippageSummary();

        expect(
            getByText(getTranslation('moduleTrading.slippage.summary.offered')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.slippage.summary.deduction')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.slippage.summary.minimum')),
        ).toBeOnTheScreen();
    });

    it('should show offered amount and symbol from the quote', () => {
        const { getByText } = renderSlippageSummary();

        expect(getByText(`${mercuryoDexQuote.receiveStringAmount} BTC`)).toBeOnTheScreen();
    });

    it('should calculate deduction and minimum receive from slippage', () => {
        const { getByText } = renderSlippageSummary('1');

        expect(getByText('-0.00000836 BTC')).toBeOnTheScreen();
        expect(getByText('0.00082718 BTC')).toBeOnTheScreen();
    });

    it('should use swapSlippage from the quote when form value is empty', () => {
        const { getByText } = renderSlippageSummary('');

        expect(getByText('-0.00000836 BTC')).toBeOnTheScreen();
        expect(getByText('0.00082718 BTC')).toBeOnTheScreen();
    });

    it('should recalculate values when slippage changes', () => {
        const { getByText } = renderSlippageSummary('3');

        expect(getByText('-0.00002507 BTC')).toBeOnTheScreen();
        expect(getByText('0.00081047 BTC')).toBeOnTheScreen();
    });

    describe('quote validation', () => {
        it('should throw when swapSlippage is undefined', () => {
            const quote = { ...mercuryoDexQuote, swapSlippage: undefined };

            expect(() => renderSlippageSummary(undefined, quote)).toThrow(
                'swapSlippage is required in quote for SlippageSummary',
            );
        });

        it('should throw when receiveStringAmount is undefined', () => {
            const quote = { ...mercuryoDexQuote, receiveStringAmount: undefined };

            expect(() => renderSlippageSummary(undefined, quote)).toThrow(
                'receiveStringAmount is required in quote for SlippageSummary',
            );
        });
    });
});
