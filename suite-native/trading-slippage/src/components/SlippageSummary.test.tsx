import type { ExchangeTrade } from 'invity-api';

import type { SlippageFormValues } from '@suite-common/trading';
import { yup } from '@suite-common/validators';
import { Form, useForm } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { mercuryoDexQuote } from '@suite-native/trading-fixtures';

import { SlippageSummary } from './SlippageSummary';
import { renderWithSlippageTestProvider } from '../test-utils/testUtils';

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

const renderSlippageSummary = async (slippage?: string, quote?: ExchangeTrade) =>
    await renderWithSlippageTestProvider(<TestWrapper slippage={slippage} />, { quote });

describe('SlippageSummary', () => {
    it('should render all row labels', async () => {
        const { getByText } = await renderSlippageSummary();

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

    it('should show offered amount and symbol from the quote', async () => {
        const { getByText } = await renderSlippageSummary();

        expect(getByText(`${mercuryoDexQuote.receiveStringAmount} BTC`)).toBeOnTheScreen();
    });

    it('should calculate deduction and minimum receive from slippage', async () => {
        const { getByText } = await renderSlippageSummary('1');

        expect(getByText('-0.00000836 BTC')).toBeOnTheScreen();
        expect(getByText('0.00082718 BTC')).toBeOnTheScreen();
    });

    it('should use swapSlippage from the quote when form value is empty', async () => {
        const { getByText } = await renderSlippageSummary('');

        expect(getByText('-0.00000836 BTC')).toBeOnTheScreen();
        expect(getByText('0.00082718 BTC')).toBeOnTheScreen();
    });

    it('should recalculate values when slippage changes', async () => {
        const { getByText } = await renderSlippageSummary('3');

        expect(getByText('-0.00002507 BTC')).toBeOnTheScreen();
        expect(getByText('0.00081047 BTC')).toBeOnTheScreen();
    });

    describe('quote validation', () => {
        it('should throw when swapSlippage is undefined', async () => {
            const quote = { ...mercuryoDexQuote, swapSlippage: undefined };

            await expect(renderSlippageSummary(undefined, quote)).rejects.toThrow(
                'swapSlippage is required in quote for SlippageSummary',
            );
        });

        it('should throw when receiveStringAmount is undefined', async () => {
            const quote = { ...mercuryoDexQuote, receiveStringAmount: undefined };

            await expect(renderSlippageSummary(undefined, quote)).rejects.toThrow(
                'receiveStringAmount is required in quote for SlippageSummary',
            );
        });
    });
});
