import '@suite-common/test-utils/globalOverrides';

import { useForm, useWatch } from 'react-hook-form';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type BuyCryptoPaymentMethod, type BuyTrade, type CryptoId } from 'invity-api';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    TRADING_FORM_PROVIDER_SELECT,
    type TradingBuyFormProps,
    initialState as tradingInitialState,
} from '@suite-common/trading';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { PaymentMethodModal } from './PaymentMethodModal';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../../../mocks/mockInitialAppState';

const mockUseTradingFormContext = jest.fn();

jest.mock('#src/hooks/wallet/trading/form/useTradingCommonForm', () => ({
    useTradingFormContext: () => mockUseTradingFormContext(),
}));

type MockBuyQuoteParams = {
    exchange: string;
    paymentMethod: BuyCryptoPaymentMethod;
    paymentMethodName: string;
};

const mockBuyQuote = ({
    exchange,
    paymentMethod,
    paymentMethodName,
}: MockBuyQuoteParams): BuyTrade => ({
    exchange,
    paymentMethod,
    paymentMethodName,
    fiatCurrency: 'CZK',
    fiatStringAmount: '1000',
    receiveCurrency: 'bitcoin' as CryptoId,
    receiveStringAmount: '0.0005',
    rate: 2000000,
});

const quotes: BuyTrade[] = [
    mockBuyQuote({
        exchange: 'banxa',
        paymentMethod: 'creditCard',
        paymentMethodName: 'Credit/Debit Card',
    }),
    mockBuyQuote({
        exchange: 'anycoin',
        paymentMethod: 'bankTransfer',
        paymentMethodName: 'Bank Transfer',
    }),
];

const PaymentMethodModalTestHarness = () => {
    const methods = useForm<TradingBuyFormProps>({
        defaultValues: {
            [TRADING_FORM_PAYMENT_METHOD_SELECT]: { value: 'bankTransfer', label: 'Bank Transfer' },
            [TRADING_FORM_PROVIDER_SELECT]: 'anycoin',
        },
    });
    const [paymentMethod, provider] = useWatch({
        control: methods.control,
        name: [TRADING_FORM_PAYMENT_METHOD_SELECT, TRADING_FORM_PROVIDER_SELECT],
    });

    mockUseTradingFormContext.mockReturnValue({ ...methods, type: 'buy' });

    return (
        <>
            <PaymentMethodModal onClose={() => undefined} />
            <output data-testid="@trading/form/values">
                {JSON.stringify({ paymentMethod, provider: provider ?? null })}
            </output>
        </>
    );
};

const renderPaymentMethodModal = () => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: {
            ...mockInitialAppState,
            wallet: {
                ...mockInitialAppState.wallet,
                trading: {
                    ...tradingInitialState,
                    buy: {
                        ...tradingInitialState.buy,
                        quotes,
                    },
                },
            },
        } satisfies MockSuiteState,
    });

    renderWithProviders(services, <PaymentMethodModalTestHarness />);
};

describe('PaymentMethodModal', () => {
    // Recurring bug: https://github.com/trezor/trezor-suite/issues/24383
    it('clears the picked provider when another payment method is chosen', async () => {
        renderPaymentMethodModal();

        await userEvent.click(
            screen.getByTestId('@trading/form/payment-method-select/option/creditCard'),
        );

        expect(screen.getByTestId('@trading/form/values')).toHaveTextContent(
            JSON.stringify({
                paymentMethod: { value: 'creditCard', label: 'Credit/Debit Card' },
                provider: null,
            }),
        );
    });
});
