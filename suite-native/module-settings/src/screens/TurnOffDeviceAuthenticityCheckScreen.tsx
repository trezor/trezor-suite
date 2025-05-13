import { useDispatch } from 'react-redux';

import { Translation } from '@suite-native/intl';
import { setDeviceAuthenticityCheckEnabled } from '@suite-native/settings';

import { TurnOffCheckScreenContent } from '../components/TurnOffCheckScreenContent';

export const TurnOffDeviceAuthenticityCheckScreen = () => {
    const dispatch = useDispatch();

    const handleConfirm = () => {
        dispatch(setDeviceAuthenticityCheckEnabled(false));
    };

    return (
        <TurnOffCheckScreenContent
            title={
                <Translation id="moduleSettings.advanced.authenticityChecks.device.turnOffTitle" />
            }
            onConfirm={handleConfirm}
        />
    );
};
