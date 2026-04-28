import { useDispatch } from 'react-redux';

import { isCountrySubdivisionRequired } from '@suite-common/trading';
import { Button } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { residenceActions } from '@suite-native/trading-state';

import { useCountrySubdivisionPickerControls } from './CountrySheet/CountrySubdivisionPickerControlsContext';
import { useCountrySelectionAnalyticsReport } from '../hooks/useCountrySelectionAnalyticsReport';
import { useFormCountryCode } from '../hooks/useFormCountryCode';
import { type TradingLocationFormValues } from '../types/tradingLocationForm';
import { getPreferredCountryOption } from '../utils/getPreferredCountryOption';

export type ConfirmLocationButtonProps = {
    afterConfirm: () => void;
};

export const ConfirmLocationButton = ({ afterConfirm }: ConfirmLocationButtonProps) => {
    const countryCode = useFormCountryCode();
    const { watch } = useFormContext<TradingLocationFormValues>();
    const countrySubdivision = watch('countrySubdivision');
    const { showSheet: showCountrySubdivisionPicker } = useCountrySubdivisionPickerControls();
    const dispatch = useDispatch();
    const analyticsReport = useCountrySelectionAnalyticsReport();
    const isSubdivisionMissing =
        isCountrySubdivisionRequired(countryCode) && typeof countrySubdivision === 'undefined';

    const confirmLocation = () => {
        dispatch(
            residenceActions.setResidenceCountry({
                country: countryCode,
                countrySubdivision: countrySubdivision?.value,
            }),
        );
        analyticsReport(
            getPreferredCountryOption().value === countryCode ? 'submitDefault' : 'submitCustom',
        );
        afterConfirm();
    };

    const handlePress = isSubdivisionMissing ? showCountrySubdivisionPicker : confirmLocation;

    return (
        <Button intent="brand" priority="primary" onPress={handlePress}>
            <Translation
                id={
                    isSubdivisionMissing
                        ? 'tradingResidence.locationSettings.selectCountrySubdivisionButton'
                        : 'tradingResidence.locationSettings.confirmButton'
                }
            />
        </Button>
    );
};
