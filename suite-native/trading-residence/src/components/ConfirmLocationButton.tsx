import { useDispatch } from 'react-redux';

import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useFormCountryCode } from '../hooks/useFormCountryCode';
import { tradingResidenceActions } from '../reducers/residenceSlice';

export type ConfirmLocationButtonProps = {
    afterConfirm: () => void;
};

export const ConfirmLocationButton = ({ afterConfirm }: ConfirmLocationButtonProps) => {
    const countryCode = useFormCountryCode();
    const dispatch = useDispatch();

    const confirmLocation = () => {
        dispatch(tradingResidenceActions.setResidenceCountry(countryCode));
        afterConfirm();
    };

    return (
        <Button colorScheme="primary" size="medium" onPress={confirmLocation}>
            <Translation id="tradingResidence.locationSettings.confirmButton" />
        </Button>
    );
};
