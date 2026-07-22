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
import { sellActions } from '@suite-native/trading-state';
import { type SellFormType } from '@suite-native/trading-types';

import { createTradingLightStore } from '../../../../__tests__/tradingTestUtils';
import { useSellForm } from '../../../../hooks/sell/useSellForm';
import { SellFiatCurrencyPicker } from '../SellFiatCurrencyPicker';

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

describe('SellFiatCurrencyPicker', () => {
    let form: SellFormType;
    let store: TestStore;

    beforeEach(() => {
        mockUseListDataFilter = jest.requireActual('@suite-common/trading').useListDataFilter;
        reportMock.mockClear();
        store = createTradingLightStore({ tradeType: 'sell' });
        const { result } = renderHookWithStoreProvider(() => useSellForm(), {
            services,
            store,
        });
        form = result.current;
    });

    afterEach(() => {
        screen.unmount();
    });

    const renderFiatCurrencyPicker = () =>
        renderWithStoreProvider(
            <Form form={form}>
                <SellFiatCurrencyPicker />
            </Form>,
            {
                services,
                store,
            },
        );

    it('should display selected currency', () => {
        const { getByLabelText } = renderFiatCurrencyPicker();

        expect(
            getByLabelText(getTranslation('moduleTrading.selectFiat.buttonTitle')),
        ).toHaveTextContent(/USD/);
    });

    it('should allow to select currency', async () => {
        const { getByText, getByLabelText } = renderFiatCurrencyPicker();

        fireEvent.press(getByLabelText(getTranslation('moduleTrading.selectFiat.buttonTitle')));
        fireEvent.press(getByText('PLN'));

        // wait for validators to run
        await act(() => Promise.resolve());

        expect(
            getByLabelText(getTranslation('moduleTrading.selectFiat.buttonTitle')),
        ).toHaveTextContent(/PLN/);
    });

    it('should apply sell fiat currency change effects on selection', async () => {
        form.setValue('fiatStringAmount', '100');
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { getByText, getByLabelText } = renderFiatCurrencyPicker();

        fireEvent.press(getByLabelText(getTranslation('moduleTrading.selectFiat.buttonTitle')));
        fireEvent.press(getByText('PLN'));
        await act(() => Promise.resolve());

        expect(form.getValues('fiatStringAmount')).toBeUndefined();
        expect(dispatchSpy).toHaveBeenCalledWith(sellActions.fiatCurrencyChanged());
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: {
                type: 'sell',
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
