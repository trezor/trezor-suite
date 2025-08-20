import { analytics } from '@suite-common/analytics';
import {
    renderHookWithStoreProviderAsync,
    renderWithBasicProvider,
    userEvent,
} from '@suite-native/test-utils';

import { useBuyForm } from '../../../../hooks/buy/useBuyForm';
import { useListDataFilter } from '../../../../hooks/general/useListDataFilter';
import { BuyFormType } from '../../../../types/buy';
import {
    CountryOfResidencePicker,
    CountryOfResidencePickerProps,
} from '../CountryOfResidencePicker';

let mockUseListDataFilter: typeof useListDataFilter;

jest.mock('../../../../hooks/general/useListDataFilter', () => ({
    ...jest.requireActual('../../../../hooks/general/useListDataFilter'),
    useListDataFilter: (rawData: unknown[], filterCallback: (i: unknown, f: string) => boolean) =>
        mockUseListDataFilter(rawData, filterCallback),
}));

describe('CountryOfResidencePicker', () => {
    beforeEach(() => {
        mockUseListDataFilter = jest.requireActual(
            '../../../../hooks/general/useListDataFilter',
        ).useListDataFilter;
    });

    const renderCountryOfResidencePicker = async (
        props: Partial<CountryOfResidencePickerProps<BuyFormType>> = {},
    ) => {
        const { result } = await renderHookWithStoreProviderAsync(() => useBuyForm());

        return renderWithBasicProvider(
            <CountryOfResidencePicker
                form={result.current}
                testID="TEST_ID"
                tradingType="buy"
                {...props}
            />,
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
        await userEvent.press(getByText('Country of residence'));
        await userEvent.press(getByText(/Algeria/));

        expect(getByLabelText('Selected country of residence')).toHaveTextContent('🇩🇿 Algeria');
    });

    it('should display empty component when filtered data is empty', async () => {
        mockUseListDataFilter = () => ({
            filteredData: [],
            setFilterValue: jest.fn(),
            filterValue: 'test-key',
        });
        const { getByText } = await renderCountryOfResidencePicker();
        await userEvent.press(getByText('Country of residence'));

        expect(getByText('Country not found')).toBeTruthy();
        expect(
            getByText('Check the spelling or browse the list to select an option.'),
        ).toBeTruthy();
    });

    it('should report to analytics after country changed', async () => {
        const reportSpy = jest.spyOn(analytics, 'report');
        const { getByText } = await renderCountryOfResidencePicker();

        await userEvent.press(getByText('Country of residence'));
        await userEvent.press(getByText(/Algeria/));

        expect(reportSpy).toHaveBeenCalled();
    });

    it('should not report to analytics when user selects already selected country', async () => {
        const reportSpy = jest.spyOn(analytics, 'report');
        const { getByText, getAllByText } = await renderCountryOfResidencePicker();

        await userEvent.press(getByText('Country of residence'));
        await userEvent.press(getByText(/Algeria/));
        reportSpy.mockClear();

        await userEvent.press(getAllByText(/Algeria/)[0]);
        await userEvent.press(getAllByText(/Algeria/)[1]);

        expect(reportSpy).not.toHaveBeenCalled();
    });
});
