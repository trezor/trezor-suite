import { useDispatch } from 'react-redux';

import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useCountrySelectionAnalyticsReport } from '../hooks/useCountrySelectionAnalyticsReport';
import { useFormCountryCode } from '../hooks/useFormCountryCode';
import { tradingResidenceActions } from '../reducers/residenceSlice';
import { getPreferredCountryOption } from '../utils/getPreferredCountryOption';

export type ConfirmLocationButtonProps = {
    afterConfirm: () => void;
};

export const ConfirmLocationButton = ({ afterConfirm }: ConfirmLocationButtonProps) => {
    const countryCode = useFormCountryCode();
    const dispatch = useDispatch();
    const analyticsReport = useCountrySelectionAnalyticsReport();

    const confirmLocation = () => {
        dispatch(tradingResidenceActions.setResidenceCountry(countryCode));
        analyticsReport(
            getPreferredCountryOption().value === countryCode ? 'submitDefault' : 'submitCustom',
        );
        afterConfirm();
    };

    return (
        <Button colorScheme="primary" size="medium" onPress={confirmLocation}>
            <Translation id="tradingResidence.locationSettings.confirmButton" />
        </Button>
    );
};
