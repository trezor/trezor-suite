import { Translation, type TranslationKey } from '@suite/intl';
import { type TrezorDevice } from '@suite-common/suite-types';
import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { Column, H2, Modal } from '@trezor/components';
import { getDeviceColorVariant } from '@trezor/device-utils';
import { ConfirmOnDevicePill } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { ConnectModalBackdrop } from 'src/components/suite/ConnectModalBackdrop';
import { DeviceConfirmImage } from 'src/components/suite/DeviceConfirmImage';

interface ConfirmActionModalViewProps {
    device: TrezorDevice;
    title?: TranslationKey;
    onCancel?: () => void;
    onBackdropDismiss?: () => void;
    cancelable?: boolean;
    enableBackdropClick?: boolean;
}

export const ConfirmActionModalView = ({
    title,
    device,
    onCancel,
    onBackdropDismiss = onCancel,
    cancelable = true,
    enableBackdropClick = true,
}: ConfirmActionModalViewProps) => (
    <ConnectModalBackdrop
        onClick={enableBackdropClick ? onBackdropDismiss : undefined}
        data-testid="@suite/modal/confirm-action-on-device"
        canSwitchDevice
    >
        <ConfirmOnDevicePill
            title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
            deviceModelInternal={getDeviceInternalModel(device)}
            deviceUnitColor={getDeviceColorVariant(device)}
            onCancel={cancelable ? onCancel : undefined}
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
