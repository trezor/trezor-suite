import { useDispatch } from '@suite-common/redux-utils';
import { Translation } from '@suite-native/intl';
import { setCheckFirmwareAuthenticityEnabled } from '@suite-native/settings';

import { TurnOffCheckScreenContent } from '../components/TurnOffCheckScreenContent';

export const TurnOffFirmwareAuthenticityCheckScreen = () => {
    const dispatch = useDispatch();

    const handleConfirm = () => {
        dispatch(setCheckFirmwareAuthenticityEnabled(false));
    };

    return (
        <TurnOffCheckScreenContent
            title={
                <Translation id="moduleSettings.advanced.authenticityChecks.firmware.turnOffTitle" />
            }
            onConfirm={handleConfirm}
        />
    );
};
