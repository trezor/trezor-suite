import { useIntl } from 'react-intl';

import { Translation, type TranslationKey, messages } from '@suite/intl';
import { type TrezorDevice } from '@suite-common/suite-types';
import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { Column, H2, Modal } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { getDeviceColorVariant } from '@trezor/device-utils';
import { ConfirmOnDevicePill } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { ConnectModalBackdrop } from 'src/components/suite/ConnectModalBackdrop';
import { DeviceConfirmImage } from 'src/components/suite/DeviceConfirmImage';

interface ConfirmActionProps {
    cancelable?: boolean;
    device: TrezorDevice;
    title?: TranslationKey;
    onCancel?: () => void;
    enableBackdropClick?: boolean;
}

export const ConfirmActionModal = ({
    title,
    device,
    onCancel,
    cancelable = true,
    enableBackdropClick = true,
}: ConfirmActionProps) => {
    const intl = useIntl();
    const handleCancel = () => {
        if (!cancelable) {
            return;
        }
        TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));
        onCancel?.();
    };

    return (
        <ConnectModalBackdrop
            onClick={enableBackdropClick ? onCancel : undefined}
            data-testid="@suite/modal/confirm-action-on-device"
            canSwitchDevice
        >
            <ConfirmOnDevicePill
                title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                deviceModelInternal={getDeviceInternalModel(device)}
                deviceUnitColor={getDeviceColorVariant(device)}
                onCancel={cancelable ? handleCancel : undefined}
            />
            <Modal.ModalBase width={400}>
                <Column alignItems="center" gap={16}>
                    <DeviceConfirmImage device={device} />
                    <H2
                        align="center"
                        margin={{ left: spacings.md, right: spacings.md, bottom: spacings.md }}
                    >
                        <Translation id={title ?? 'TR_CONFIRM_ACTION_ON_YOUR'} />
                    </H2>
                </Column>
            </Modal.ModalBase>
        </ConnectModalBackdrop>
    );
};
