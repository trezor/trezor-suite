import { useIntl } from 'react-intl';

import { messages } from '@suite/intl';
import { selectSelectedDeviceLabelOrName } from '@suite-common/device';
import { selectIsDiscoveryStatusConfirmEmptyPassphrase } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

import { useSelector } from 'src/hooks/suite';
import type { TrezorDevice } from 'src/types/suite';

import { PassphraseOnDeviceModalView } from './PassphraseOnDeviceModalView';

interface PassphraseOnDeviceModalProps {
    device: TrezorDevice;
}

/**
 * Modal used with T2T1 with legacy firmware as result of 'ButtonRequest_PassphraseType' where passphrase source is requested on device
 * @param {PassphraseOnDeviceModalProps}
 */
export const PassphraseOnDeviceModal = ({ device }: PassphraseOnDeviceModalProps) => {
    const intl = useIntl();
    const confirmEmptyPassphrase = useSelector(selectIsDiscoveryStatusConfirmEmptyPassphrase);
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);

    const onCancel = () =>
        TrezorConnect.cancel({ reason: intl.formatMessage(messages.TR_CANCELLED) });

    return (
        <PassphraseOnDeviceModalView
            device={device}
            deviceLabel={deviceLabel}
            confirmEmptyPassphrase={confirmEmptyPassphrase}
            onCancel={onCancel}
        />
    );
};
