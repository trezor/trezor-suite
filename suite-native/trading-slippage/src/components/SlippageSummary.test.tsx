import type { ExchangeTrade } from 'invity-api';

import type { SlippageFormValues } from '@suite-common/trading';
import { yup } from '@suite-common/validators';
import { Form, useForm } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { mercuryoDexQuote } from '@suite-native/trading-fixtures';

import { SlippageSummary } from './SlippageSummary';
import { renderWithSlippageTestProvider } from '../test-utils/testUtils';

const validationSchema = yup.object({ slippage: yup.string() });

type TestWrapperProps = {
    receiveAmount?: string;
    slippage?: string;
};

type RenderSlippageSummaryOptions = TestWrapperProps & {
    quote?: ExchangeTrade;
};

const TestWrapper = ({
    receiveAmount = mercuryoDexQuote.receiveStringAmount!,
    slippage = '1',
}: TestWrapperProps) => {
    const form = useForm<SlippageFormValues>({
        defaultValues: { slippage },
        validation: validationSchema,
    });

    return (
        <Form form={form}>
            <SlippageSummary receiveAmount={receiveAmount} />
        </Form>
    );
};

const renderSlippageSummary = async ({
    slippage,
    quote,
    receiveAmount,
}: RenderSlippageSummaryOptions = {}) =>
    await renderWithSlippageTestProvider(
        <TestWrapper slippage={slippage} receiveAmount={receiveAmount} />,
        { quote },
    );

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

    it('should show offered amount and symbol', async () => {
        const { getByText } = await renderSlippageSummary();

        expect(getByText(`${mercuryoDexQuote.receiveStringAmount} BTC`)).toBeOnTheScreen();
    });

    it('should calculate values from the provided receive amount', async () => {
        const { getByText } = await renderSlippageSummary({
            slippage: '1',
            receiveAmount: '1',
        });

        expect(getByText('1 BTC')).toBeOnTheScreen();
        expect(getByText('-0.01 BTC')).toBeOnTheScreen();
        expect(getByText('0.99 BTC')).toBeOnTheScreen();
    });

    it('should calculate deduction and minimum receive from slippage', async () => {
        const { getByText } = await renderSlippageSummary({ slippage: '1' });

        expect(getByText('-0.00000836 BTC')).toBeOnTheScreen();
        expect(getByText('0.00082718 BTC')).toBeOnTheScreen();
    });

    it('should use swapSlippage from the quote when form value is empty', async () => {
        const { getByText } = await renderSlippageSummary({ slippage: '' });

        expect(getByText('-0.00000836 BTC')).toBeOnTheScreen();
        expect(getByText('0.00082718 BTC')).toBeOnTheScreen();
    });

    it('should recalculate values when slippage changes', async () => {
        const { getByText } = await renderSlippageSummary({ slippage: '3' });

        expect(getByText('-0.00002507 BTC')).toBeOnTheScreen();
        expect(getByText('0.00081047 BTC')).toBeOnTheScreen();
    });

    describe('quote validation', () => {
        it('should throw when swapSlippage is undefined', async () => {
            const quote = { ...mercuryoDexQuote, swapSlippage: undefined };

            await expect(renderSlippageSummary({ quote })).rejects.toThrow(
                'swapSlippage is required in quote for SlippageSummary',
            );
        });
    });
});
