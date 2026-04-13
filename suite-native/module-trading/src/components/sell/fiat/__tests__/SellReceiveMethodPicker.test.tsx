import { events } from '@suite-native/analytics';
import { Form } from '@suite-native/forms';
import { useAnalytics } from '@suite-native/services';
import {
    type PreloadedState,
    act,
    fireEvent,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils-store';
import {
    banxaBankTransferSellQuote,
    getWalletState,
    sellQuotes,
} from '@suite-native/trading-fixtures';
import { type SellFormType } from '@suite-native/trading-types';

import { useSellForm } from '../../../../hooks/sell/useSellForm';
import { SellReceiveMethodPicker } from '../SellReceiveMethodPicker';

const reportMock = jest.fn();

jest.mock('@suite-native/services', () => {
    const original = jest.requireActual('@suite-native/services');

    return {
        ...original,
        useAnalytics: jest.fn(),
    };
});

describe('SellReceiveMethodPicker', () => {
    let form: SellFormType;
    let preloadedState: PreloadedState;

    const renderSellForm = () => renderHookWithStoreProvider(() => useSellForm());

    const renderSellReceiveMethodPicker = () =>
        renderWithStoreProvider(<SellReceiveMethodPicker />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(() => {
        jest.clearAllMocks();

        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });

        preloadedState = { wallet: getWalletState({ tradeType: 'sell' }) };

        const { result } = renderSellForm();
        form = result.current;
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render nothing when no quotes are loaded', () => {
        const { toJSON } = renderSellReceiveMethodPicker();

        expect(toJSON()).toBeNull();
    });

    it('should render loading skeleton when no quotes are loaded and new quotes are loading', () => {
        preloadedState!.wallet!.trading!.sell!.isLoading = true;

        const { getByLabelText } = renderSellReceiveMethodPicker();

        expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
    });

    it('should render "Not selected" when no quote is selected', () => {
        preloadedState!.wallet!.trading!.sell!.quotes = sellQuotes;

        const { getByLabelText } = renderSellReceiveMethodPicker();

        expect(getByLabelText('No receive method selected')).toHaveTextContent('Not selected');
    });

    describe('with quotes loaded', () => {
        beforeEach(() => {
            preloadedState!.wallet!.trading!.sell!.quotes = sellQuotes;
            act(() => {
                form.setValue('quote', banxaBankTransferSellQuote);
            });
        });

        it('should render selected receive method', () => {
            const { getByLabelText } = renderSellReceiveMethodPicker();

            expect(getByLabelText('Selected receive method')).toHaveTextContent('Bank Transfer');
        });

        it('should render loading skeleton when quotes are loaded and new quotes are loading', () => {
            preloadedState!.wallet!.trading!.sell!.isLoading = true;

            const { getByLabelText } = renderSellReceiveMethodPicker();

            expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
        });

        it('should allow to select receive method', () => {
            const { getByText, getByLabelText } = renderSellReceiveMethodPicker();

            fireEvent.press(getByText('Receive method'));
            fireEvent.press(getByText('Credit Card'));

            expect(getByLabelText('Selected receive method')).toHaveTextContent('Credit Card');
        });

        describe('analytics', () => {
            beforeEach(() => {
                reportMock.mockClear();
            });

            it('should fire analytics event on receive method select', () => {
                const { getByText } = renderSellReceiveMethodPicker();

                fireEvent.press(getByText('Receive method'));
                fireEvent.press(getByText('Credit Card'));

                expect(reportMock).toHaveBeenCalledWith({
                    type: events.tradingParameterChangedEvent.name,
                    payload: {
                        type: 'sell',
                        parameter: 'paymentMethod',
                    },
                });
            });

            it('should not fire analytics event when same receive method is selected', () => {
                const { getAllByText } = renderSellReceiveMethodPicker();

                fireEvent.press(getAllByText('Bank Transfer')[0]);
                fireEvent.press(getAllByText('Bank Transfer')[1]);

                expect(reportMock).toHaveBeenCalledTimes(0);
            });
        });
    });
});
