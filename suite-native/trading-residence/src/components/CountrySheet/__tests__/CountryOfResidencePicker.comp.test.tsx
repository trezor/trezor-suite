import { analytics } from '@suite-native/analytics';
import { Form, useForm } from '@suite-native/forms';
import {
    renderHookWithBasicProvider,
    renderHookWithStoreProviderAsync,
    renderWithBasicProvider,
    screen,
    userEvent,
} from '@suite-native/test-utils';
import { useListDataFilter } from '@suite-native/trading-atoms';

import { useLocationForm } from '../../../hooks/useLocationForm';
import { TradingLocationFormValues } from '../../../types/tradingLocationForm';
import { locationFormValidationSchema } from '../../../utils/locationFormValidationSchema';
import {
    CountryOfResidencePicker,
    CountryOfResidencePickerProps,
} from '../CountryOfResidencePicker';

let mockUseListDataFilter: typeof useListDataFilter;

jest.mock('@suite-native/trading-atoms', () => ({
    ...jest.requireActual('@suite-native/trading-atoms'),
    useListDataFilter: (rawData: unknown[], filterCallback: (i: unknown, f: string) => boolean) =>
        mockUseListDataFilter(rawData, filterCallback),
}));

describe('CountryOfResidencePicker', () => {
    beforeEach(() => {
        mockUseListDataFilter = jest.requireActual('@suite-native/trading-atoms').useListDataFilter;
    });

    afterEach(() => {
        // make sure component is unmounted (FlashList otherwise might try to do some magic)
        screen.unmount();
    });

    const renderCountryOfResidencePicker = async (
        props: Partial<CountryOfResidencePickerProps> = {},
    ) => {
        const { result } = await renderHookWithStoreProviderAsync(() => useLocationForm());

        return renderWithBasicProvider(
            <CountryOfResidencePicker testID="TEST_ID" context="settings" {...props} />,
            {
                wrapper: ({ children }) => <Form form={result.current}>{children}</Form>,
            },
        );
    };

    it('should display value from expo-localization (Poland) when in default state', async () => {
        const { getByLabelText } = await renderCountryOfResidencePicker();

        expect(getByLabelText('Selected country of residence')).toHaveTextContent('🇵🇱 Poland');
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

    it('should render even when no value is selected', () => {
        const formWithoutCountrySet = renderHookWithBasicProvider(() =>
            useForm<TradingLocationFormValues>({ validation: locationFormValidationSchema }),
        );

        const { getByLabelText } = renderWithBasicProvider(
            <CountryOfResidencePicker testID="TEST_ID" context="settings" />,
            {
                wrapper: ({ children }) => (
                    <Form form={formWithoutCountrySet.result.current}>{children}</Form>
                ),
            },
        );

        expect(getByLabelText('No country of residence selected')).toHaveTextContent(
            'Not selected',
        );
    });

    it('should render without TestID', async () => {
        const { getByText, queryByTestId } = await renderCountryOfResidencePicker({
            testID: undefined,
        });

        expect(getByText('Country of residence')).toBeOnTheScreen();
        expect(queryByTestId('undefined/value')).toBeNull();
    });
});
