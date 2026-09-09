import { type ReactNode, useEffect, useState } from 'react';

import { type Store, combineReducers } from '@reduxjs/toolkit';

import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { useFormContext } from '@suite-native/forms';
import { getTranslation, localeReducer } from '@suite-native/intl';
import {
    createLightStore,
    createStaticReducer,
    fireEvent,
    renderWithStoreProvider,
    userEvent,
} from '@suite-native/test-utils-store';
import {
    residenceReducer,
    selectTradingResidenceCountry,
    selectTradingResidenceCountrySubdivision,
} from '@suite-native/trading-state';
import { type TradingResidenceRootState } from '@suite-native/trading-types';

import { ConfirmLocationButton, type ConfirmLocationButtonProps } from './ConfirmLocationButton';
import { type TradingLocationFormValues } from '../types/tradingLocationForm';
import { CountrySubdivisionPicker } from './CountrySheet/CountrySubdivisionPicker';
import { CountrySubdivisionPickerControlsContext } from './CountrySheet/CountrySubdivisionPickerControlsContext';
import { LocationForm } from './LocationForm';

type State = TradingResidenceRootState;

const mockAnalyticsReport = jest.fn();

const ConfirmLocationButtonWithChangedCountry = () => {
    const { setValue } = useFormContext<TradingLocationFormValues>();

    useEffect(() => {
        setValue('country', {
            value: 'SK',
            label: '🇸🇰 Slovakia',
            shortLabel: '🇸🇰 SVK',
            codeAlpha3: 'SVK',
            flag: '🇸🇰',
            name: 'Slovakia',
        });
    }, [setValue]);

    return <ConfirmLocationButton afterConfirm={jest.fn} />;
};

const ConfirmLocationButtonWithUSCountry = ({
    afterConfirm,
    countrySubdivision,
}: {
    afterConfirm: () => void;
    countrySubdivision?: TradingLocationFormValues['countrySubdivision'];
}) => {
    const { setValue } = useFormContext<TradingLocationFormValues>();

    useEffect(() => {
        setValue('country', {
            value: 'US',
            label: '🇺🇸 United States',
            shortLabel: '🇺🇸 USA',
            codeAlpha3: 'USA',
            flag: '🇺🇸',
            name: 'United States',
        });
        setValue('countrySubdivision', countrySubdivision);
    }, [setValue, countrySubdivision]);

    return (
        <>
            <CountrySubdivisionPicker
                testID="@trading/residence/country-subdivision"
                noBottomBorder
            />
            <ConfirmLocationButton afterConfirm={afterConfirm} />
        </>
    );
};

const LocationFormWithCountrySubdivisionPickerControls = ({
    children,
}: {
    children: ReactNode;
}) => {
    const [isSheetVisible, setIsSheetVisible] = useState(false);

    return (
        <CountrySubdivisionPickerControlsContext
            value={{
                isSheetVisible,
                hideSheet: () => setIsSheetVisible(false),
                showSheet: () => setIsSheetVisible(true),
            }}
        >
            <LocationForm>{children}</LocationForm>
        </CountrySubdivisionPickerControlsContext>
    );
};

describe('ConfirmLocationButton', () => {
    let store: Store<State>;

    const renderConfirmLocationButton = async (props: Partial<ConfirmLocationButtonProps>) =>
        await renderWithStoreProvider(<ConfirmLocationButton afterConfirm={jest.fn} {...props} />, {
            wrapper: LocationForm,
            services: { analytics: mockNativeAnalytics(mockAnalyticsReport), store },
        });

    beforeEach(() => {
        jest.clearAllMocks();
        store = createLightStore({
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
    });

    it('should set location and call afterConfirmMock on press', async () => {
        const afterConfirmMock = jest.fn();

        const { getByText } = await renderConfirmLocationButton({ afterConfirm: afterConfirmMock });
        await fireEvent.press(
            getByText(getTranslation('tradingResidence.locationSettings.confirmButton')),
        );

        // from expo-localization mock
        expect(selectTradingResidenceCountry(store.getState())).toBe('PL');
        expect(selectTradingResidenceCountrySubdivision(store.getState())).toBeUndefined();
        expect(afterConfirmMock).toHaveBeenCalled();
    });

    it('should log submitDefault event on press', async () => {
        const { getByText } = await renderConfirmLocationButton({});
        await fireEvent.press(
            getByText(getTranslation('tradingResidence.locationSettings.confirmButton')),
        );

        expect(mockAnalyticsReport).toHaveBeenCalledTimes(1);
        expect(mockAnalyticsReport).toHaveBeenCalledWith({
            type: events.tradingCountrySelectionEvent.name,
            payload: expect.objectContaining({ action: 'submitDefault' }),
        });
    });

    it('should log submitCustom when selected value does not match the default one', async () => {
        const { getByText } = await renderWithStoreProvider(
            <ConfirmLocationButtonWithChangedCountry />,
            {
                wrapper: LocationForm,
                services: { analytics: mockNativeAnalytics(mockAnalyticsReport), store },
            },
        );

        await fireEvent.press(
            getByText(getTranslation('tradingResidence.locationSettings.confirmButton')),
        );

        expect(mockAnalyticsReport).toHaveBeenCalledTimes(1);
        expect(mockAnalyticsReport).toHaveBeenCalledWith({
            type: events.tradingCountrySelectionEvent.name,
            payload: expect.objectContaining({ action: 'submitCustom' }),
        });
    });

    it('should open subdivision picker and not confirm when subdivision is required but missing', async () => {
        const afterConfirmMock = jest.fn();
        const { getByText, queryByText } = await renderWithStoreProvider(
            <ConfirmLocationButtonWithUSCountry afterConfirm={afterConfirmMock} />,
            {
                wrapper: LocationFormWithCountrySubdivisionPickerControls,
                services: { analytics: mockNativeAnalytics(mockAnalyticsReport), store },
            },
        );

        expect(
            queryByText(getTranslation('tradingResidence.locationSettings.confirmButton')),
        ).not.toBeOnTheScreen();

        await userEvent.press(
            getByText(
                getTranslation('tradingResidence.locationSettings.selectCountrySubdivisionButton'),
            ),
        );

        expect(getByText('California')).toBeOnTheScreen();
        expect(selectTradingResidenceCountry(store.getState())).toBeUndefined();
        expect(selectTradingResidenceCountrySubdivision(store.getState())).toBeUndefined();
        expect(mockAnalyticsReport).not.toHaveBeenCalled();
        expect(afterConfirmMock).not.toHaveBeenCalled();
    });

    it('should persist subdivision when required subdivision is selected', async () => {
        const afterConfirmMock = jest.fn();
        const { getByText } = await renderWithStoreProvider(
            <ConfirmLocationButtonWithUSCountry
                afterConfirm={afterConfirmMock}
                countrySubdivision={{
                    value: 'CA',
                    label: 'California',
                    name: 'California',
                }}
            />,
            {
                wrapper: LocationFormWithCountrySubdivisionPickerControls,
                services: { analytics: mockNativeAnalytics(mockAnalyticsReport), store },
            },
        );

        await fireEvent.press(
            getByText(getTranslation('tradingResidence.locationSettings.confirmButton')),
        );

        expect(selectTradingResidenceCountry(store.getState())).toBe('US');
        expect(selectTradingResidenceCountrySubdivision(store.getState())).toBe('CA');
        expect(afterConfirmMock).toHaveBeenCalledTimes(1);
    });
});
