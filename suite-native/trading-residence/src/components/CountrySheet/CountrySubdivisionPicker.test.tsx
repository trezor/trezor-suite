import { type ReactNode, useState } from 'react';

import { Form, useForm } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { renderHookWithBasicProvider, renderWithBasicProvider } from '@suite-native/test-utils';
import { screen, userEvent } from '@suite-native/test-utils-store';

import { CountrySubdivisionPicker } from './CountrySubdivisionPicker';
import { CountrySubdivisionPickerControlsContext } from './CountrySubdivisionPickerControlsContext';
import { type TradingLocationFormValues } from '../../types/tradingLocationForm';
import { locationFormValidationSchema } from '../../utils/locationFormValidationSchema';

const usaCountry = {
    value: 'US',
    label: '🇺🇸 United States',
    shortLabel: '🇺🇸 USA',
    codeAlpha3: 'USA',
    flag: '🇺🇸',
    name: 'United States',
} as const;

const czechiaCountry = {
    value: 'CZ',
    label: '🇨🇿 Czechia',
    shortLabel: '🇨🇿 CZE',
    codeAlpha3: 'CZE',
    flag: '🇨🇿',
    name: 'Czechia',
} as const;

const TestCountrySubdivisionPickerControlsProvider = ({ children }: { children: ReactNode }) => {
    const [isSheetVisible, setIsSheetVisible] = useState(false);

    return (
        <CountrySubdivisionPickerControlsContext
            value={{
                isSheetVisible,
                hideSheet: () => setIsSheetVisible(false),
                showSheet: () => setIsSheetVisible(true),
            }}
        >
            {children}
        </CountrySubdivisionPickerControlsContext>
    );
};

describe('CountrySubdivisionPicker', () => {
    afterEach(async () => {
        await screen.unmount();
    });

    const renderCountrySubdivisionPicker = async (defaultValues: TradingLocationFormValues) => {
        const form = await renderHookWithBasicProvider(() =>
            useForm<TradingLocationFormValues>({
                defaultValues,
                validation: locationFormValidationSchema,
            }),
        );

        const renderResult = await renderWithBasicProvider(
            <CountrySubdivisionPicker testID="TEST_ID" noBottomBorder />,
            {
                wrapper: ({ children }) => (
                    <TestCountrySubdivisionPickerControlsProvider>
                        <Form form={form.result.current}>{children}</Form>
                    </TestCountrySubdivisionPickerControlsProvider>
                ),
            },
        );

        return {
            ...renderResult,
            form: form.result.current,
        };
    };

    it('should render nothing when selected country does not require subdivision', async () => {
        const { queryByText } = await renderCountrySubdivisionPicker({
            country: czechiaCountry,
        });

        expect(
            queryByText(getTranslation('tradingResidence.locationSettings.countrySubdivision')),
        ).toBeNull();
    });

    it('should render empty value when selected country requires subdivision', async () => {
        const { getByLabelText } = await renderCountrySubdivisionPicker({
            country: usaCountry,
        });

        expect(
            getByLabelText(
                getTranslation('tradingResidence.locationSettings.noCountrySubdivision'),
            ),
        ).toHaveTextContent(getTranslation('tradingResidence.locationSettings.notSelected'));
    });

    it('should display selected subdivision', async () => {
        const { getByLabelText } = await renderCountrySubdivisionPicker({
            country: usaCountry,
            countrySubdivision: {
                value: 'CA',
                label: 'California',
                name: 'California',
            },
        });

        expect(
            getByLabelText(
                getTranslation('tradingResidence.locationSettings.selectedCountrySubdivision'),
            ),
        ).toHaveTextContent('California');
    });

    it('should allow to select subdivision', async () => {
        const { getByText, getByLabelText } = await renderCountrySubdivisionPicker({
            country: usaCountry,
        });

        await userEvent.press(
            getByText(getTranslation('tradingResidence.locationSettings.countrySubdivision')),
        );
        await userEvent.press(getByText('California'));

        expect(
            getByLabelText(
                getTranslation('tradingResidence.locationSettings.selectedCountrySubdivision'),
            ),
        ).toHaveTextContent('California');
    });
});
