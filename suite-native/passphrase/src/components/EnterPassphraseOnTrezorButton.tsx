import { useDispatch, useSelector } from 'react-redux';

import {
    selectDeviceInternalModel,
    selectSelectedDevice,
    submitPassphrase,
} from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { Button } from '@suite-native/atoms';
import { DeviceModelIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';

export const EnterPassphraseOnTrezorButton = () => {
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const analytics = useAnalytics();
    const deviceModel = useSelector(selectDeviceInternalModel);

    const handleSubmitOnDevice = () => {
        analytics.report({ type: events.passphraseEnterOnTrezorEvent.name });
        if (!device) return;
        dispatch(submitPassphrase({ device, passphrase: '', passphraseOnDevice: true }));
    };

    if (!deviceModel || !device) return null;

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
