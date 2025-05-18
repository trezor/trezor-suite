import { Form } from '@suite-native/forms';
import {
    fireEvent,
    renderHookWithStoreProviderAsync,
    renderWithBasicProvider,
} from '@suite-native/test-utils';

import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { useListDataFilter } from '../../../hooks/general/useListDataFilter';
import { BuyCountryOfResidencePicker } from '../BuyCountryOfResidencePicker';

let mockUseListDataFilter: typeof useListDataFilter;

jest.mock('../../../hooks/general/useListDataFilter', () => ({
    ...jest.requireActual('../../../hooks/general/useListDataFilter'),
    useListDataFilter: (rawData: unknown[], filterCallback: (i: unknown, f: string) => boolean) =>
        mockUseListDataFilter(rawData, filterCallback),
}));

describe('CountryOfResidencePicker', () => {
    beforeEach(() => {
        mockUseListDataFilter = jest.requireActual(
            '../../../hooks/general/useListDataFilter',
        ).useListDataFilter;
    });

    const renderCountryOfResidencePicker = async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useBuyForm());

        return renderWithBasicProvider(
            <Form form={result.current}>
                <BuyCountryOfResidencePicker />
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
            filterValue: 'test-key',
        });
        const { getByText } = await renderCountryOfResidencePicker();
        fireEvent.press(getByText('Country of residence'));

        expect(getByText('Country not found')).toBeTruthy();
        expect(
            getByText('Check the spelling or browse the list to select an option.'),
        ).toBeTruthy();
    });
});
