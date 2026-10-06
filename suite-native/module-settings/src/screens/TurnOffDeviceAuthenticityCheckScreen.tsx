import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { Translation } from '@suite-native/intl';
import { setDeviceAuthenticityCheckEnabled } from '@suite-native/settings';

import { TurnOffCheckScreenContent } from '../components/TurnOffCheckScreenContent';

export const TurnOffDeviceAuthenticityCheckScreen = () => {
    const { dispatch } = useServices(injectDispatch);

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
