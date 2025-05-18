import { Form } from '@suite-native/forms';
import {
    act,
    fireEvent,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getInitializedTradingState } from '../../../__fixtures__/tradingState';
import { useTradingBuyForm } from '../../../hooks/buy/useBuyForm';
import { useListDataFilter } from '../../../hooks/general/useListDataFilter';
import { BuyFiatCurrencyPicker } from '../BuyFiatCurrencyPicker';

let mockUseListDataFilter: typeof useListDataFilter;

jest.mock('../../../hooks/general/useListDataFilter', () => ({
    ...jest.requireActual('../../../hooks/general/useListDataFilter'),
    useListDataFilter: (rawData: unknown[], filterCallback: (i: unknown, f: string) => boolean) =>
        mockUseListDataFilter(rawData, filterCallback),
}));

describe('FiatCurrencyPicker', () => {
    beforeEach(() => {
        mockUseListDataFilter = jest.requireActual(
            '../../../hooks/general/useListDataFilter',
        ).useListDataFilter;
    });

    const renderFiatCurrencyPicker = async () => {
        const preloadedState = { wallet: { tradingNew: getInitializedTradingState() } };
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm(), {
            preloadedState,
        });

        return renderWithStoreProviderAsync(
            <Form form={result.current}>
                <BuyFiatCurrencyPicker />
            </Form>,
            {
                preloadedState,
            },
        );
    };

    it('should display selected currency', async () => {
        const { getByLabelText } = await renderFiatCurrencyPicker();

        expect(getByLabelText('Select fiat currency')).toHaveTextContent(/CZK/);
    });

    it('should allow to select currency', async () => {
        const { getByText, getByLabelText } = await renderFiatCurrencyPicker();

        fireEvent.press(getByLabelText('Select fiat currency'));
        fireEvent.press(getByText('USD'));

        // wait for validators to run
        await act(() => Promise.resolve());

        expect(getByLabelText('Select fiat currency')).toHaveTextContent(/USD/);
    });

    it('should display empty component when filtered data is empty', async () => {
        mockUseListDataFilter = () => ({
            filteredData: [],
            setFilterValue: jest.fn(),
            filterValue: 'test-key',
        });

        const { getByText } = await renderFiatCurrencyPicker();

        expect(getByText('Currency not found')).toBeTruthy();
        expect(
            getByText('Check the spelling or browse the list to select an option.'),
        ).toBeTruthy();
    });
});
