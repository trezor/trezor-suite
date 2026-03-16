import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
    screen,
} from '@suite-native/test-utils';
import {
    btcAsset,
    exchangeQuotes,
    getInitializedTradingState,
} from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import { ExchangeForm } from '../ExchangeForm';

jest.mock('../../../hooks/general/useFocusedValueWatch', () =>
    jest.requireActual('../../../hooks/general/useFocusedValueWatch'),
);

describe('ExchangeForm', () => {
    let form: ExchangeFormType;

    const renderForm = () => renderHookWithStoreProviderAsync(() => useExchangeForm(), {});

    const renderExchangeForm = () =>
        renderWithStoreProviderAsync(<ExchangeForm />, {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
            preloadedState: {
                wallet: { trading: getInitializedTradingState() },
            },
        });

    beforeEach(async () => {
        const { result } = await renderForm();
        form = result.current;
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render form', async () => {
        const { getByText, queryByText } = await renderExchangeForm();

        expect(getByText('You get')).toBeOnTheScreen();
        expect(queryByText('Done')).toBeNull();
        expect(queryByText('Receive account')).toBeNull();
    });

    describe('with receive asset selected', () => {
        beforeEach(() => {
            act(() => {
                form.setValue('receiveAsset', btcAsset);
            });
        });

        it('should display Receive account picker', async () => {
            const { getByText, queryByText } = await renderExchangeForm();

            expect(getByText('You get')).toBeOnTheScreen();
            expect(queryByText('Done')).toBeNull();
            expect(getByText('Receive account')).toBeOnTheScreen();
        });

        it('should display Done button when any input is active', async () => {
            act(() => {
                form.setValue('focusedValue', 'sendCryptoAmount');
            });
            const { getByText, queryByText } = await renderExchangeForm();

            expect(getByText('You get')).toBeOnTheScreen();
            expect(getByText('Done')).toBeOnTheScreen();
            expect(queryByText('Receive account')).toBeNull();
        });

        describe('with quote selected', () => {
            beforeEach(() => {
                act(() => {
                    form.setValue('quote', exchangeQuotes[0]);
                });
            });

            it('should display provider', async () => {
                const { getByText } = await renderExchangeForm();

                expect(getByText('Provider')).toBeOnTheScreen();
            });
        });
    });
});
