import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectDeviceInternalModel, selectSelectedDevice } from '@suite-common/device';
import { useDispatch } from '@suite-common/redux-utils';
import { submitPassphraseThunk } from '@suite-common/wallet-core';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Button } from '@suite-native/atoms';
import { selectPassphraseRequestId } from '@suite-native/device-authorization';
import { deviceModelToIconName } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

export const EnterPassphraseOnTrezorButton = () => {
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const deviceModel = useSelector(selectDeviceInternalModel);
    const requestId = useSelector(selectPassphraseRequestId);

    const handleSubmitOnDevice = () => {
        analytics.report({ type: events.passphraseEnterOnTrezorEvent.name });
        if (!device) return;
        dispatch(
            submitPassphraseThunk({ device, passphrase: '', passphraseOnDevice: true, requestId }),
        );
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
