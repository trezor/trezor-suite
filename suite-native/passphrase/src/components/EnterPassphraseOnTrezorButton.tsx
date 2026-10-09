import { useSelector } from 'react-redux';

import { selectDeviceInternalModel, selectSelectedDevice } from '@suite-common/device';
import { submitPassphraseThunk } from '@suite-common/wallet-core';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { Button } from '@suite-native/atoms';
import { selectPassphraseRequestId } from '@suite-native/device-authorization';
import { deviceModelToIconName } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const EnterPassphraseOnTrezorButton = () => {
    const device = useSelector(selectSelectedDevice);
    const { analytics, dispatch } = useServices(injectNativeAnalytics, injectDispatch);
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
