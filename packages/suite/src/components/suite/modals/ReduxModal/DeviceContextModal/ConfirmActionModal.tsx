import { useIntl } from 'react-intl';

import { Translation, type TranslationKey, messages } from '@suite/intl';
import { type TrezorDevice } from '@suite-common/suite-types';
import { Column, H2, Modal } from '@trezor/components';
import TrezorConnect from '@trezor/connect';

import { ConnectModalBackdrop } from 'src/components/suite/ConnectModalBackdrop';
import { DeviceConfirmImage } from 'src/components/suite/DeviceConfirmImage';

type ConfirmActionProps = {
    cancelable?: boolean;
    device: TrezorDevice;
    title?: TranslationKey;
    onCancel?: () => void;
    enableBackdropClick?: boolean;
};

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
            <Modal.ModalBase width={400} onCancel={cancelable ? handleCancel : undefined}>
                <Column alignItems="center" gap={16} padding={{ horizontal: 10, bottom: 24 }}>
                    <DeviceConfirmImage device={device} />
                    <H2 align="center" textWrap="pretty">
                        <Translation id={title ?? 'TR_CONFIRM_ACTION_ON_YOUR'} />
                    </H2>
                </Column>
            </Modal.ModalBase>
        </ConnectModalBackdrop>
    );
};
