import { useDispatch, useSelector } from 'react-redux';

import { Button } from '@suite-native/atoms';
import { onPassphraseSubmit, selectDeviceInternalModel } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';
import { useAuthorizationGoBack } from '@suite-native/device-authorization';

export const NoPassphraseButton = () => {
    const dispatch = useDispatch();

    const deviceModel = useSelector(selectDeviceInternalModel);

    const { handleGoBack } = useAuthorizationGoBack();
    const handleSubmitOnDevice = () => {
        dispatch(onPassphraseSubmit({ value: '', passphraseOnDevice: false }));
        handleGoBack();
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
