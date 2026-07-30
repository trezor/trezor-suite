import { type useListDataFilter } from '@suite-common/trading';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import {
    type TestStore,
    act,
    fireEvent,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils-store';
import { buyActions } from '@suite-native/trading-state';
import { type BuyFormType } from '@suite-native/trading-types';

import { BuyFiatCurrencyPicker } from './BuyFiatCurrencyPicker';
import { useBuyForm } from '../../hooks/buy/useBuyForm';
import { createTradingLightStore } from '../../test-utils/tradingTestUtils';

let mockUseListDataFilter: typeof useListDataFilter;
const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    useListDataFilter: (rawData: unknown[], filterCallback: (i: unknown, f: string) => boolean) =>
        mockUseListDataFilter(rawData, filterCallback),
}));

describe('BuyFiatCurrencyPicker', () => {
    let form: BuyFormType;
    let store: TestStore;

    beforeEach(() => {
        mockUseListDataFilter = jest.requireActual('@suite-common/trading').useListDataFilter;
        reportMock.mockClear();
        store = createTradingLightStore({ tradeType: 'buy' });
        const { result } = renderHookWithStoreProvider(() => useBuyForm(), {
            services,
            store,
        });
        form = result.current;
    });

    const renderFiatCurrencyPicker = () =>
        renderWithStoreProvider(
            <Form form={form}>
                <BuyFiatCurrencyPicker />
            </Form>,
            {
                services,
                store,
            },
        );

    afterEach(() => {
        screen.unmount();
    });

    it('should display selected currency', () => {
        const { getByLabelText } = renderFiatCurrencyPicker();

        expect(
            getByLabelText(getTranslation('moduleTrading.selectFiat.buttonTitle')),
        ).toHaveTextContent(/CZK/);
    });

    it('should allow to select currency', async () => {
        const { getByText, getByLabelText } = renderFiatCurrencyPicker();

        fireEvent.press(getByLabelText(getTranslation('moduleTrading.selectFiat.buttonTitle')));
        fireEvent.press(getByText('USD'));

        // wait for validators to run
        await act(() => Promise.resolve());

        expect(
            getByLabelText(getTranslation('moduleTrading.selectFiat.buttonTitle')),
        ).toHaveTextContent(/USD/);
    });

    it('should apply buy fiat currency change effects on selection', async () => {
        form.setValue('fiatValue', '100');
        form.setValue('cryptoValue', '0.1');
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { getByText, getByLabelText } = renderFiatCurrencyPicker();

        fireEvent.press(getByLabelText(getTranslation('moduleTrading.selectFiat.buttonTitle')));
        fireEvent.press(getByText('USD'));
        await act(() => Promise.resolve());

        expect(form.getValues('fiatValue')).toBeUndefined();
        expect(form.getValues('cryptoValue')).toBeUndefined();
        expect(dispatchSpy).toHaveBeenCalledWith(buyActions.fiatCurrencyChanged());
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: {
                type: 'buy',
                parameter: 'fiat',
            },
        });
    });

    it('should display empty component when filtered data is empty', () => {
        mockUseListDataFilter = () => ({
            filteredData: [],
            setFilterValue: jest.fn(),
            filterValue: 'test-key',
        });

        const { getByText } = renderFiatCurrencyPicker();

        expect(
            getByText(getTranslation('moduleTrading.fiatCurrencySheet.emptyTitle')),
        ).toBeTruthy();
        expect(
            getByText(getTranslation('moduleTrading.fiatCurrencySheet.emptyDescription')),
        ).toBeTruthy();
    });
});
