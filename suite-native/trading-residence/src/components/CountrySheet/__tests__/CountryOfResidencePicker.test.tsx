import { combineReducers } from '@reduxjs/toolkit';

import { useCountryFilteredData } from '@suite-common/trading';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { Form, useForm } from '@suite-native/forms';
import { localeReducer } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import { renderHookWithBasicProvider, renderWithBasicProvider } from '@suite-native/test-utils';
import {
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
    screen,
    userEvent,
} from '@suite-native/test-utils-store';
import { residenceReducer } from '@suite-native/trading-state';

import { useLocationForm } from '../../../hooks/useLocationForm';
import { type TradingLocationFormValues } from '../../../types/tradingLocationForm';
import { locationFormValidationSchema } from '../../../utils/locationFormValidationSchema';
import {
    CountryOfResidencePicker,
    type CountryOfResidencePickerProps,
} from '../CountryOfResidencePicker';

let mockUseCountryFilteredData: jest.Mock;

const reportMock = jest.fn();

jest.mock('@suite-native/services', () => {
    const original = jest.requireActual('@suite-native/services');

    return {
        ...original,
        useAnalytics: jest.fn(),
    };
});

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    useCountryFilteredData: jest.fn(),
}));

describe('CountryOfResidencePicker', () => {
    const createTradingResidenceStore = () =>
        createLightStore({
            reducer: {
                locale: localeReducer,
                wallet: combineReducers({
                    settings: createStaticReducer(initialWalletSettingsState),
                    trading: combineReducers({
                        residence: residenceReducer,
                    }),
                }),
            },
        });

    beforeEach(() => {
        jest.clearAllMocks();

        const { nonSanctionedRegional } = jest.requireActual('@suite-common/trading');

        mockUseCountryFilteredData = jest.fn(() => ({
            filteredData: nonSanctionedRegional.countriesOptions,
            filterValue: '',
            setFilterValue: jest.fn(),
        }));

        (useCountryFilteredData as jest.Mock).mockImplementation(mockUseCountryFilteredData);

        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });
    });

    afterEach(() => {
        // make sure component is unmounted (FlashList otherwise might try to do some magic)
        screen.unmount();
    });

    const renderCountryOfResidencePicker = (props: Partial<CountryOfResidencePickerProps> = {}) => {
        const { result } = renderHookWithStoreProvider(() => useLocationForm(), {
            store: createTradingResidenceStore(),
        });

        return renderWithBasicProvider(
            <CountryOfResidencePicker testID="TEST_ID" context="settings" {...props} />,
            {
                wrapper: ({ children }) => <Form form={result.current}>{children}</Form>,
            },
        );
    };

    it('should display value from expo-localization (Poland) when in default state', () => {
        const { getByLabelText } = renderCountryOfResidencePicker();

        expect(getByLabelText('Selected country of residence')).toHaveTextContent('POL');
    });

    it('should allow to select country', async () => {
        const { getByText, getByLabelText } = renderCountryOfResidencePicker();

        await userEvent.press(getByText('Country of residence'));
        await userEvent.press(getByText(/Algeria/));

        expect(getByLabelText('Selected country of residence')).toHaveTextContent('DZA');
    });

    it('should display empty component when filtered data is empty', async () => {
        (useCountryFilteredData as jest.Mock).mockImplementation(() => ({
            filteredData: [],
            filterValue: 'test-key',
            setFilterValue: jest.fn(),
        }));

        const { getByText } = renderCountryOfResidencePicker();
        await userEvent.press(getByText('Country of residence'));

        expect(getByText('Country not found')).toBeTruthy();
        expect(
            getByText('Check the spelling or browse the list to select an option.'),
        ).toBeTruthy();
    });

    it('should report to analytics after country changed', async () => {
        const { getByText } = renderCountryOfResidencePicker();

        await userEvent.press(getByText('Country of residence'));
        await userEvent.press(getByText(/Algeria/));

        expect(reportMock).toHaveBeenCalled();
    });

    it('should not report to analytics when user selects already selected country', async () => {
        const { getByText } = renderCountryOfResidencePicker();

        await userEvent.press(getByText('Country of residence'));
        await userEvent.press(getByText(/Algeria/));
        reportMock.mockClear();

        await userEvent.press(getByText('Country of residence'));
        await userEvent.press(getByText(/Algeria/));

        expect(reportMock).not.toHaveBeenCalled();
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

    it('should render without TestID', () => {
        const { getByText, queryByTestId } = renderCountryOfResidencePicker({
            testID: undefined,
        });

        expect(getByText('Country of residence')).toBeOnTheScreen();
        expect(queryByTestId('undefined/value')).toBeNull();
    });
});
