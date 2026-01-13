import { useSelector } from 'react-redux';

import { selectDeviceInternalModel } from '@suite-common/wallet-core';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useNavigateToInitialScreen } from '@suite-native/navigation';
import TrezorConnect, { UI } from '@trezor/connect';

export const NoPassphraseButton = () => {
    const deviceModel = useSelector(selectDeviceInternalModel);

    const navigateToInitialScreen = useNavigateToInitialScreen();
    const handleSubmitOnDevice = () => {
        TrezorConnect.uiResponse({
            type: UI.RECEIVE_PASSPHRASE,
            payload: {
                value: '',
                passphraseOnDevice: false,
            },
        });
        navigateToInitialScreen();
    };

    if (!deviceModel) return null;

    return (
        <Button
            onPress={handleSubmitOnDevice}
            colorScheme="tertiaryElevation0"
            viewLeft="arrowRight"
        >
            <Translation id="modulePassphrase.noPassphrase.button" />
        </Button>
    );
};
