import { type ReactNode, useEffect, useState } from 'react';

import { combineReducers } from '@reduxjs/toolkit';

import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { useFormContext } from '@suite-native/forms';
import { getTranslation, localeReducer } from '@suite-native/intl';
import {
    type TestStore,
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

import { type TradingLocationFormValues } from '../../types/tradingLocationForm';
import { ConfirmLocationButton, type ConfirmLocationButtonProps } from '../ConfirmLocationButton';
import { CountrySubdivisionPicker } from '../CountrySheet/CountrySubdivisionPicker';
import { CountrySubdivisionPickerControlsContext } from '../CountrySheet/CountrySubdivisionPickerControlsContext';
import { LocationForm } from '../LocationForm';

const mockAnalyticsReport = jest.fn();

jest.mock('../../hooks/useCountrySelectionAnalyticsReport', () => ({
    useCountrySelectionAnalyticsReport: () => mockAnalyticsReport,
}));

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
    let store: TestStore;

    const renderConfirmLocationButton = (props: Partial<ConfirmLocationButtonProps>) =>
        renderWithStoreProvider(<ConfirmLocationButton afterConfirm={jest.fn} {...props} />, {
            wrapper: LocationForm,
            store,
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

    it('should set location and call afterConfirmMock on press', () => {
        const afterConfirmMock = jest.fn();

        const { getByText } = renderConfirmLocationButton({ afterConfirm: afterConfirmMock });
        fireEvent.press(
            getByText(getTranslation('tradingResidence.locationSettings.confirmButton')),
        );

        // from expo-localization mock
        expect(selectTradingResidenceCountry(store.getState())).toBe('PL');
        expect(selectTradingResidenceCountrySubdivision(store.getState())).toBeUndefined();
        expect(afterConfirmMock).toHaveBeenCalled();
    });

    it('should log submitDefault event on press', () => {
        const { getByText } = renderConfirmLocationButton({});
        fireEvent.press(
            getByText(getTranslation('tradingResidence.locationSettings.confirmButton')),
        );

        expect(mockAnalyticsReport).toHaveBeenCalledTimes(1);
        expect(mockAnalyticsReport).toHaveBeenCalledWith('submitDefault');
    });

    it('should log submitCustom when selected value does not match the default one', () => {
        const { getByText } = renderWithStoreProvider(<ConfirmLocationButtonWithChangedCountry />, {
            wrapper: LocationForm,
            store,
        });

        fireEvent.press(
            getByText(getTranslation('tradingResidence.locationSettings.confirmButton')),
        );

        expect(mockAnalyticsReport).toHaveBeenCalledTimes(1);
        expect(mockAnalyticsReport).toHaveBeenCalledWith('submitCustom');
    });

    it('should open subdivision picker and not confirm when subdivision is required but missing', async () => {
        const afterConfirmMock = jest.fn();
        const { getByText, queryByText } = renderWithStoreProvider(
            <ConfirmLocationButtonWithUSCountry afterConfirm={afterConfirmMock} />,
            {
                wrapper: LocationFormWithCountrySubdivisionPickerControls,
                store,
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

    it('should persist subdivision when required subdivision is selected', () => {
        const afterConfirmMock = jest.fn();
        const { getByText } = renderWithStoreProvider(
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
                store,
            },
        );

        fireEvent.press(
            getByText(getTranslation('tradingResidence.locationSettings.confirmButton')),
        );

        expect(selectTradingResidenceCountry(store.getState())).toBe('US');
        expect(selectTradingResidenceCountrySubdivision(store.getState())).toBe('CA');
        expect(afterConfirmMock).toHaveBeenCalledTimes(1);
    });
});
