import { useDispatch } from 'react-redux';

import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { residenceActions } from '@suite-native/trading-state';

import { useCountrySelectionAnalyticsReport } from '../hooks/useCountrySelectionAnalyticsReport';
import { useFormCountryCode } from '../hooks/useFormCountryCode';
import { getPreferredCountryOption } from '../utils/getPreferredCountryOption';

export type ConfirmLocationButtonProps = {
    afterConfirm: () => void;
};

export const ConfirmLocationButton = ({ afterConfirm }: ConfirmLocationButtonProps) => {
    const countryCode = useFormCountryCode();
    const dispatch = useDispatch();
    const analyticsReport = useCountrySelectionAnalyticsReport();

    const confirmLocation = () => {
        dispatch(residenceActions.setResidenceCountry(countryCode));
        analyticsReport(
            getPreferredCountryOption().value === countryCode ? 'submitDefault' : 'submitCustom',
        );
        afterConfirm();
    };

    return (
        <Button intent="brand" priority="primary" size="medium" onPress={confirmLocation}>
            <Translation id="tradingResidence.locationSettings.confirmButton" />
        </Button>
    );
};
