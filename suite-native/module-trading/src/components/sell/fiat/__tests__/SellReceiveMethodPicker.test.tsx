import { events } from '@suite-native/analytics';
import { Form } from '@suite-native/forms';
import { useAnalytics } from '@suite-native/services';
import { act, fireEvent, screen } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import {
    PreloadedState,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils/store';
import { getWalletState, sellQuotes } from '@suite-native/trading-fixtures';
import { SellFormType } from '@suite-native/trading-types';

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

    const renderSellForm = () => renderHookWithStoreProviderAsync(() => useSellForm());

    const renderSellReceiveMethodPicker = () =>
        renderWithStoreProviderAsync(<SellReceiveMethodPicker />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        jest.clearAllMocks();

        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });

        preloadedState = { wallet: getWalletState({ tradeType: 'sell' }) };

        const { result } = await renderSellForm();
        form = result.current;
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render nothing when no quotes are loaded', async () => {
        const { toJSON } = await renderSellReceiveMethodPicker();

        expect(toJSON()).toBeNull();
    });

    it('should render loading skeleton when no quotes are loaded and new quotes are loading', async () => {
        preloadedState!.wallet!.trading!.sell!.isLoading = true;

        const { getByLabelText } = await renderSellReceiveMethodPicker();

        expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
    });

    it('should render "Not selected" when no quote is selected', async () => {
        preloadedState!.wallet!.trading!.sell!.quotes = sellQuotes;

        const { getByLabelText } = await renderSellReceiveMethodPicker();

        expect(getByLabelText('No receive method selected')).toHaveTextContent('Not selected');
    });

    describe('with quotes loaded', () => {
        beforeEach(() => {
            preloadedState!.wallet!.trading!.sell!.quotes = sellQuotes;
            act(() => {
                form.setValue('quote', sellQuotes[1]);
            });
        });

        it('should render selected receive method', async () => {
            const { getByLabelText } = await renderSellReceiveMethodPicker();

            expect(getByLabelText('Selected receive method')).toHaveTextContent('Bank Transfer');
        });

        it('should render loading skeleton when quotes are loaded and new quotes are loading', async () => {
            preloadedState!.wallet!.trading!.sell!.isLoading = true;

            const { getByLabelText } = await renderSellReceiveMethodPicker();

            expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
        });

        it('should allow to select receive method', async () => {
            const { getByText, getByLabelText } = await renderSellReceiveMethodPicker();

            fireEvent.press(getByText('Receive method'));
            fireEvent.press(getByText('Credit Card'));

            expect(getByLabelText('Selected receive method')).toHaveTextContent('Credit Card');
        });

        describe('analytics', () => {
            beforeEach(() => {
                reportMock.mockClear();
            });

            it('should fire analytics event on receive method select', async () => {
                const { getByText } = await renderSellReceiveMethodPicker();

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

            it('should not fire analytics event when same receive method is selected', async () => {
                const { getAllByText } = await renderSellReceiveMethodPicker();

                fireEvent.press(getAllByText('Bank Transfer')[0]);
                fireEvent.press(getAllByText('Bank Transfer')[1]);

                expect(reportMock).toHaveBeenCalledTimes(0);
            });
        });
    });
});
