import { Form } from '@suite-native/forms';
import {
    fireEvent,
    renderHookWithStoreProviderAsync,
    renderWithBasicProvider,
} from '@suite-native/test-utils';

import { useListDataFilter } from '../../../hooks/useListDataFilter';
import { useTradingBuyForm } from '../../../hooks/useTradingBuyForm';
import { CountryOfResidencePicker } from '../CountryOfResidencePicker';

let mockUseListDataFilter: typeof useListDataFilter;

jest.mock('../../../hooks/useListDataFilter', () => ({
    ...jest.requireActual('../../../hooks/useListDataFilter'),
    useListDataFilter: (rawData: unknown[], filterCallback: (i: unknown, f: string) => boolean) =>
        mockUseListDataFilter(rawData, filterCallback),
}));

describe('CountryOfResidencePicker', () => {
    beforeEach(() => {
        mockUseListDataFilter = jest.requireActual(
            '../../../hooks/useListDataFilter',
        ).useListDataFilter;
    });

    const renderCountryOfResidencePicker = async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm());

        return renderWithBasicProvider(
            <Form form={result.current}>
                <CountryOfResidencePicker />
            </Form>,
        );
    };

    it('should display "Not selected" when in default state', async () => {
        const { getByLabelText } = await renderCountryOfResidencePicker();

        expect(getByLabelText('No country of residence selected')).toHaveTextContent(
            'Not selected',
        );
    });

    it('should allow to select country', async () => {
        const { getByText, getByLabelText } = await renderCountryOfResidencePicker();

        // select country
        fireEvent.press(getByText('Country of residence'));
        fireEvent.press(getByText(/Algeria/));

        expect(getByLabelText('Selected country of residence')).toHaveTextContent('🇩🇿 Algeria');
    });

    it('should display empty component when filtered data is empty', async () => {
        mockUseListDataFilter = () => ({
            filteredData: [],
            setFilterValue: jest.fn(),
        });
        const { getByText } = await renderCountryOfResidencePicker();
        fireEvent.press(getByText('Country of residence'));

        expect(getByText('No country found')).toBeDefined();
        expect(getByText(/a country matching your search/)).toBeDefined();
    });
});
