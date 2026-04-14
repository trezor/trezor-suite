import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils';
import {
    btcAsset,
    getInitializedTradingState,
    mercuryoFixedWorstQuote,
} from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import { ExchangeForm } from '../ExchangeForm';

jest.mock('../../../hooks/general/useFocusedValueWatch', () =>
    jest.requireActual('../../../hooks/general/useFocusedValueWatch'),
);

describe('ExchangeForm', () => {
    let form: ExchangeFormType;

    const renderForm = () => renderHookWithStoreProvider(() => useExchangeForm(), {});

    const renderExchangeForm = () =>
        renderWithStoreProvider(<ExchangeForm />, {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
            preloadedState: {
                wallet: { trading: getInitializedTradingState() },
            },
        });

    beforeEach(() => {
        const { result } = renderForm();
        form = result.current;
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render form', () => {
        const { getByText, queryByText } = renderExchangeForm();

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

        it('should display Receive account picker', () => {
            const { getByText, queryByText } = renderExchangeForm();

            expect(getByText('You get')).toBeOnTheScreen();
            expect(queryByText('Done')).toBeNull();
            expect(getByText('Receive account')).toBeOnTheScreen();
        });

        it('should display Done button when any input is active', () => {
            act(() => {
                form.setValue('focusedValue', 'sendCryptoAmount');
            });
            const { getByText, queryByText } = renderExchangeForm();

            expect(getByText('You get')).toBeOnTheScreen();
            expect(getByText('Done')).toBeOnTheScreen();
            expect(queryByText('Receive account')).toBeNull();
        });

        describe('with quote selected', () => {
            beforeEach(() => {
                act(() => {
                    form.setValue('quote', mercuryoFixedWorstQuote);
                });
            });

            it('should display provider', () => {
                const { getByText } = renderExchangeForm();

                expect(getByText('Provider')).toBeOnTheScreen();
            });
        });
    });
});
