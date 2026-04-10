import { useDispatch, useSelector } from 'react-redux';

import { selectDeviceInternalModel, selectSelectedDevice } from '@suite-common/device';
import { submitPassphrase } from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { Button } from '@suite-native/atoms';
import { deviceModelToIconName } from '@suite-native/icons';
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
            intent="neutral"
            priority="secondary"
            iconLeft={deviceModelToIconName(deviceModel)}
        >
            <Translation id="modulePassphrase.enterPassphraseOnTrezor.button" />
        </Button>
    );
};
