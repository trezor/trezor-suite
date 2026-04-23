import { type useListDataFilter } from '@suite-common/trading';
import { Form } from '@suite-native/forms';
import {
    act,
    fireEvent,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils-store';
import { getInitializedTradingState } from '@suite-native/trading-fixtures';

import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyFiatCurrencyPicker } from '../BuyFiatCurrencyPicker';

let mockUseListDataFilter: typeof useListDataFilter;

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    useListDataFilter: (rawData: unknown[], filterCallback: (i: unknown, f: string) => boolean) =>
        mockUseListDataFilter(rawData, filterCallback),
}));

describe('BuyFiatCurrencyPicker', () => {
    beforeEach(() => {
        mockUseListDataFilter = jest.requireActual('@suite-common/trading').useListDataFilter;
    });

    const renderFiatCurrencyPicker = () => {
        const preloadedState = { wallet: { trading: getInitializedTradingState() } };
        const { result } = renderHookWithStoreProvider(() => useBuyForm(), {
            preloadedState,
            providers: ['intl', 'navigation'],
        });

        return renderWithStoreProvider(
            <Form form={result.current}>
                <BuyFiatCurrencyPicker />
            </Form>,
            {
                preloadedState,
                providers: ['intl', 'navigation'],
            },
        );
    };

    afterEach(() => {
        screen.unmount();
    });

    it('should display selected currency', () => {
        const { getByLabelText } = renderFiatCurrencyPicker();

        expect(getByLabelText('Select fiat currency')).toHaveTextContent(/CZK/);
    });

    it('should allow to select currency', async () => {
        const { getByText, getByLabelText } = renderFiatCurrencyPicker();

        fireEvent.press(getByLabelText('Select fiat currency'));
        fireEvent.press(getByText('USD'));

        // wait for validators to run
        await act(() => Promise.resolve());

        expect(getByLabelText('Select fiat currency')).toHaveTextContent(/USD/);
    });

    it('should display empty component when filtered data is empty', () => {
        mockUseListDataFilter = () => ({
            filteredData: [],
            setFilterValue: jest.fn(),
            filterValue: 'test-key',
        });

        const { getByText } = renderFiatCurrencyPicker();

        expect(getByText('Currency not found')).toBeTruthy();
        expect(
            getByText('Check the spelling or browse the list to select an option.'),
        ).toBeTruthy();
    });
});
