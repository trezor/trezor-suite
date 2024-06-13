import { useDispatch, useSelector } from 'react-redux';

import { Button } from '@suite-native/atoms';
import { onPassphraseSubmit, selectDeviceInternalModel } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';
import { DeviceModelIcon } from '@suite-common/icons';

export const EnterPassphraseOnTrezorButton = () => {
    const dispatch = useDispatch();

    const deviceModel = useSelector(selectDeviceInternalModel);

    const handleSubmitOnDevice = () => {
        dispatch(onPassphraseSubmit({ value: '', passphraseOnDevice: true }));
    };

    if (!deviceModel) return null;

    return (
        <Button
            onPress={handleSubmitOnDevice}
            colorScheme="tertiaryElevation0"
            viewLeft={<DeviceModelIcon deviceModel={deviceModel} />}
        >
            <Translation id="modulePassphrase.enterPassphraseOnTrezor.button" />
        </Button>
    );
};
