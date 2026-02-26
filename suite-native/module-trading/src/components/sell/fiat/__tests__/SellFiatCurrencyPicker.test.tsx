import { useListDataFilter } from '@suite-common/trading';
import { Form } from '@suite-native/forms';
import { act, fireEvent, screen } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import {
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils/store';
import { getWalletState } from '@suite-native/trading-fixtures';

import { useSellForm } from '../../../../hooks/sell/useSellForm';
import { SellFiatCurrencyPicker } from '../SellFiatCurrencyPicker';

let mockUseListDataFilter: typeof useListDataFilter;

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    useListDataFilter: (rawData: unknown[], filterCallback: (i: unknown, f: string) => boolean) =>
        mockUseListDataFilter(rawData, filterCallback),
}));

describe('SellFiatCurrencyPicker', () => {
    beforeEach(() => {
        mockUseListDataFilter = jest.requireActual('@suite-common/trading').useListDataFilter;
    });

    afterEach(() => {
        screen.unmount();
    });

    const renderFiatCurrencyPicker = async () => {
        const preloadedState = { wallet: getWalletState({ tradeType: 'sell' }) };
        const { result } = await renderHookWithStoreProviderAsync(() => useSellForm(), {
            preloadedState,
        });

        return renderWithStoreProviderAsync(
            <Form form={result.current}>
                <SellFiatCurrencyPicker />
            </Form>,
            {
                preloadedState,
            },
        );
    };

    it('should display selected currency', async () => {
        const { getByLabelText } = await renderFiatCurrencyPicker();

        expect(getByLabelText('Select fiat currency')).toHaveTextContent(/USD/);
    });

    it('should allow to select currency', async () => {
        const { getByText, getByLabelText } = await renderFiatCurrencyPicker();

        fireEvent.press(getByLabelText('Select fiat currency'));
        fireEvent.press(getByText('PLN'));

        // wait for validators to run
        await act(() => Promise.resolve());

        expect(getByLabelText('Select fiat currency')).toHaveTextContent(/PLN/);
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
