import { useDispatch, useSelector } from 'react-redux';

import { selectDeviceInternalModel, selectSelectedDevice } from '@suite-common/device';
import { submitPassphrase } from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { Button } from '@suite-native/atoms';
import { deviceModelToIconName } from '@suite-native/icons';
import { selectPassphraseRequestId } from '@suite-native/device-authorization';
import { Translation } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';

export const EnterPassphraseOnTrezorButton = () => {
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const analytics = useAnalytics();
    const deviceModel = useSelector(selectDeviceInternalModel);
    const requestId = useSelector(selectPassphraseRequestId);

    const handleSubmitOnDevice = () => {
        analytics.report({ type: events.passphraseEnterOnTrezorEvent.name });
        if (!device) return;
        dispatch(submitPassphrase({ device, passphrase: '', passphraseOnDevice: true, requestId }));
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
