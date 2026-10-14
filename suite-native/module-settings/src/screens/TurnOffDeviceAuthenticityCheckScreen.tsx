import { Translation } from '@suite-native/intl';
import { setDeviceAuthenticityCheckEnabled } from '@suite-native/settings';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

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
