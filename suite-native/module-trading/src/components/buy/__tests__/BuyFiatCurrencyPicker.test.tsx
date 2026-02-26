import { useListDataFilter } from '@suite-common/trading';
import { Form } from '@suite-native/forms';
import { act, fireEvent, screen } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import {
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils/store';
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

    const renderFiatCurrencyPicker = async () => {
        const preloadedState = { wallet: { trading: getInitializedTradingState() } };
        const { result } = await renderHookWithStoreProviderAsync(() => useBuyForm(), {
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

    afterEach(() => {
        screen.unmount();
    });

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
