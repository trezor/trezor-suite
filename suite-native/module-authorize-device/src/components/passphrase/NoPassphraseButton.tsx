import { useDispatch, useSelector } from 'react-redux';

import { onPassphraseSubmit, selectDeviceInternalModel } from '@suite-common/wallet-core';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useNavigateToInitialScreen } from '@suite-native/navigation';

export const NoPassphraseButton = () => {
    const dispatch = useDispatch();

    const deviceModel = useSelector(selectDeviceInternalModel);

    const navigateToInitialScreen = useNavigateToInitialScreen();
    const handleSubmitOnDevice = () => {
        dispatch(onPassphraseSubmit({ value: '', passphraseOnDevice: false }));
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
