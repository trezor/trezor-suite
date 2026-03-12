import { useEffect } from 'react';

import { useFormContext } from '@suite-native/forms';
import { fireEvent } from '@suite-native/test-utils';
import { type TestStore, initStore, renderWithStoreProvider } from '@suite-native/test-utils/store';
import { selectTradingResidenceCountry } from '@suite-native/trading-state';

import { TradingLocationFormValues } from '../../types/tradingLocationForm';
import { ConfirmLocationButton, ConfirmLocationButtonProps } from '../ConfirmLocationButton';
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

describe('ConfirmLocationButton', () => {
    let store: TestStore;

    const renderConfirmLocationButton = (props: Partial<ConfirmLocationButtonProps>) =>
        renderWithStoreProvider(<ConfirmLocationButton afterConfirm={jest.fn} {...props} />, {
            wrapper: LocationForm,
            store,
        });

    beforeEach(() => {
        jest.clearAllMocks();
        store = initStore().store;
    });

    it('should set location and call afterConfirmMock on press', () => {
        const afterConfirmMock = jest.fn();

        const { getByText } = renderConfirmLocationButton({ afterConfirm: afterConfirmMock });
        fireEvent.press(getByText('Confirm location'));

        // from expo-localization mock
        expect(selectTradingResidenceCountry(store.getState())).toBe('PL');
        expect(afterConfirmMock).toHaveBeenCalled();
    });

    it('should log submitDefault event on press', () => {
        const { getByText } = renderConfirmLocationButton({});
        fireEvent.press(getByText('Confirm location'));

        expect(mockAnalyticsReport).toHaveBeenCalledTimes(1);
        expect(mockAnalyticsReport).toHaveBeenCalledWith('submitDefault');
    });

    it('should log submitCustom when selected value does not match the default one', () => {
        const { getByText } = renderWithStoreProvider(<ConfirmLocationButtonWithChangedCountry />, {
            wrapper: LocationForm,
            store,
        });

        fireEvent.press(getByText('Confirm location'));

        expect(mockAnalyticsReport).toHaveBeenCalledTimes(1);
        expect(mockAnalyticsReport).toHaveBeenCalledWith('submitCustom');
    });
});
