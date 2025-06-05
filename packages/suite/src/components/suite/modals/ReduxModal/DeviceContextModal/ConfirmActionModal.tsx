import { useIntl } from 'react-intl';

import styled from 'styled-components';

import { TranslationKey } from '@suite-common/intl-types';
import { getDeviceColorVariant, getDeviceInternalModel } from '@suite-common/suite-utils';
import { H2, Modal } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { ConfirmOnDevice } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { DeviceConfirmImage } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import messages from 'src/support/messages';
import { TrezorDevice } from 'src/types/suite';

const ImageWrapper = styled.div`
    display: flex;
    justify-content: center;
`;

interface ConfirmActionProps {
    device: TrezorDevice;
    title?: TranslationKey;
    onCancel?: () => void;
}

export const ConfirmActionModal = ({ title, device, onCancel }: ConfirmActionProps) => {
    const intl = useIntl();
    const handleCancel = () => {
        TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));
        onCancel?.();
    };

    return (
        <Modal.Backdrop onClick={onCancel} data-testid="@suite/modal/confirm-action-on-device">
            <ConfirmOnDevice
                title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                deviceModelInternal={getDeviceInternalModel(device)}
                deviceUnitColor={getDeviceColorVariant(device)}
                onCancel={handleCancel}
            />
            <Modal.ModalBase size="tiny">
                <ImageWrapper>
                    <DeviceConfirmImage device={device} />
                </ImageWrapper>
                <H2
                    align="center"
                    margin={{ left: spacings.md, right: spacings.md, bottom: spacings.md }}
                >
                    <Translation id={title ?? 'TR_CONFIRM_ACTION_ON_YOUR'} />
                </H2>
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
};
