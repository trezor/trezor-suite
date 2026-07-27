import { useSelector } from 'react-redux';

import { selectDeviceInternalModel } from '@suite-common/device';
import { Button } from '@suite-native/atoms';
import { selectPassphraseRequestId } from '@suite-native/device-authorization';
import { Translation } from '@suite-native/intl';
import { useNavigateToInitialScreen } from '@suite-native/navigation';
import TrezorConnect, { UI_RESPONSE } from '@trezor/connect';

export const NoPassphraseButton = () => {
    const deviceModel = useSelector(selectDeviceInternalModel);
    const requestId = useSelector(selectPassphraseRequestId);

    const navigateToInitialScreen = useNavigateToInitialScreen();
    const handleSubmitOnDevice = () => {
        TrezorConnect.uiResponse({
            type: UI_RESPONSE.RECEIVE_PASSPHRASE,
            payload: {
                value: '',
                passphraseOnDevice: false,
            },
            requestId,
        });
        navigateToInitialScreen();
    };

    if (!deviceModel) return null;

    return (
        <Button
            onPress={handleSubmitOnDevice}
            intent="neutral"
            priority="secondary"
            iconLeft="arrowRight"
        >
            <Translation id="modulePassphrase.noPassphrase.button" />
        </Button>
    );
};
