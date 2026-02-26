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
import { SellProviderPicker } from '../SellProviderPicker';

const reportMock = jest.fn();

jest.mock('@suite-native/services', () => {
    const original = jest.requireActual('@suite-native/services');

    return {
        ...original,
        useAnalytics: jest.fn(),
    };
});

describe('SellProviderPicker', () => {
    let form: SellFormType;
    let preloadedState: PreloadedState;

    const renderSellForm = () => renderHookWithStoreProviderAsync(() => useSellForm());

    const renderSellProviderPicker = () =>
        renderWithStoreProviderAsync(<SellProviderPicker />, {
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
        const { toJSON } = await renderSellProviderPicker();

        expect(toJSON()).toBeNull();
    });

    it('should render loading skeleton when no quotes are loaded and new quotes are loading', async () => {
        preloadedState!.wallet!.trading!.sell!.isLoading = true;

        const { getByLabelText } = await renderSellProviderPicker();

        expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
    });

    describe('with quotes loaded', () => {
        beforeEach(() => {
            preloadedState!.wallet!.trading!.sell!.quotes = sellQuotes;
            act(() => {
                form.setValue('quote', sellQuotes[0]);
            });
        });

        it('should render loading skeleton when quotes are loaded and new quotes are loading', async () => {
            preloadedState!.wallet!.trading!.sell!.isLoading = true;

            const { getByLabelText } = await renderSellProviderPicker();

            expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
        });

        it('should render selected payment provider', async () => {
            const { getByLabelText } = await renderSellProviderPicker();

            expect(getByLabelText('Selected provider')).toHaveTextContent('Banxa');
        });

        it('should display kyc warning when not loading', async () => {
            const { getByText } = await renderSellProviderPicker();

            expect(getByText('This provider requires to know your identity.')).toBeOnTheScreen();
        });

        it('should not display kyc warning when loading', async () => {
            preloadedState!.wallet!.trading!.sell!.isLoading = true;
            const { queryByText } = await renderSellProviderPicker();

            expect(
                queryByText('This provider requires to know your identity.'),
            ).not.toBeOnTheScreen();
        });

        it('should allow to select provider', async () => {
            const { getByText, getByLabelText } = await renderSellProviderPicker();

            fireEvent.press(getByText('Provider'));
            fireEvent.press(getByText('MoonPay'));

            expect(getByLabelText('Selected provider')).toHaveTextContent('MoonPay');
        });

        describe('analytics', () => {
            beforeEach(() => {
                reportMock.mockClear();
            });

            it('should fire analytics event on provider select', async () => {
                const { getByText } = await renderSellProviderPicker();

                fireEvent.press(getByText('Provider'));
                fireEvent.press(getByText('MoonPay'));

                expect(reportMock).toHaveBeenCalledTimes(2);
                expect(reportMock).toHaveBeenCalledWith({
                    type: events.tradingCompareOffersEvent.name,
                    payload: {
                        type: 'sell',
                    },
                });
                expect(reportMock).toHaveBeenCalledWith({
                    type: events.tradingParameterChangedEvent.name,
                    payload: {
                        type: 'sell',
                        parameter: 'provider',
                    },
                });
            });

            it('should not fire analytics event when same provider is selected', async () => {
                const { getAllByText } = await renderSellProviderPicker();

                fireEvent.press(getAllByText('Banxa')[0]);
                fireEvent.press(getAllByText('Banxa')[1]);

                expect(reportMock).toHaveBeenCalledTimes(1);
                expect(reportMock).toHaveBeenCalledWith({
                    type: events.tradingCompareOffersEvent.name,
                    payload: {
                        type: 'sell',
                    },
                });
            });

            it('should not call analytics when user tries to open sheet while quotes are loading', async () => {
                preloadedState!.wallet!.trading!.sell!.isLoading = true;
                const { getByText } = await renderSellProviderPicker();

                fireEvent.press(getByText('Provider'));

                expect(reportMock).not.toHaveBeenCalled();
            });
        });
    });
});
