import { useIntl } from 'react-intl';

import { Translation, messages } from '@suite/intl';
import { selectSelectedDeviceLabelOrName } from '@suite-common/device';
import { selectIsDiscoveryStatusConfirmEmptyPassphrase } from '@suite-common/wallet-core';
import { Column, H2, Modal, Note } from '@trezor/components';
import TrezorConnect from '@trezor/connect';

import { DeviceConfirmImage } from 'src/components/suite/DeviceConfirmImage';
import { useSelector } from 'src/hooks/suite';
import type { TrezorDevice } from 'src/types/suite';

type PassphraseOnDeviceModalProps = {
    device: TrezorDevice;
};

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
        <Modal width={400} data-testid="@modal/enter-passphrase-on-device" onCancel={onCancel}>
            <Column alignItems="center" gap={16} padding={{ horizontal: 10, bottom: 24 }}>
                <DeviceConfirmImage device={device} />
                <H2 align="center" textWrap="pretty">
                    <Translation
                        id={
                            confirmEmptyPassphrase
                                ? 'TR_CONFIRM_EMPTY_HIDDEN_WALLET_ON'
                                : 'TR_ENTER_PASSPHRASE_ON_DEVICE_LABEL'
                        }
                        values={{ deviceLabel }}
                    />
                </H2>
                <Note>
                    <Translation
                        id={
                            confirmEmptyPassphrase
                                ? 'TR_THIS_HIDDEN_WALLET_IS_EMPTY_SOURCE'
                                : 'TR_PASSPHRASE_CASE_SENSITIVE'
                        }
                    />
                </Note>
            </Column>
        </Modal>
    );
};
