import styled from 'styled-components';
import { useIntl } from 'react-intl';

import TrezorConnect from '@trezor/connect';
import { H2, NewModal } from '@trezor/components';
import { ConfirmOnDevice } from '@trezor/product-components';
import { Translation } from 'src/components/suite/Translation';
import { DeviceConfirmImage } from 'src/components/suite';
import { TrezorDevice } from 'src/types/suite';
import { spacings } from '@trezor/theme';
import messages from 'src/support/messages';

const ImageWrapper = styled.div`
    display: flex;
    justify-content: center;
`;

interface ConfirmActionProps {
    device: TrezorDevice;
}

export const ConfirmActionModal = ({ device }: ConfirmActionProps) => {
    const intl = useIntl();
    const onCancel = () => TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));

    return (
        <NewModal.Backdrop onClick={onCancel} data-testid="@suite/modal/confirm-action-on-device">
            <ConfirmOnDevice
                title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                deviceModelInternal={device?.features?.internal_model}
                deviceUnitColor={device?.features?.unit_color}
                onCancel={onCancel}
            />
            <NewModal.ModalBase size="tiny">
                <ImageWrapper>
                    <DeviceConfirmImage device={device} />
                </ImageWrapper>
                <H2
                    align="center"
                    margin={{ left: spacings.md, right: spacings.md, bottom: spacings.md }}
                >
                    <Translation id="TR_CONFIRM_ACTION_ON_YOUR" />
                </H2>
            </NewModal.ModalBase>
        </NewModal.Backdrop>
    );
};
