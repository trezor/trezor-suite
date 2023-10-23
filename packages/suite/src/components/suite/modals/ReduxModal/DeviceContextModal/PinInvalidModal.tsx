import styled from 'styled-components';

import { P } from '@trezor/components';
import { Translation } from 'src/components/suite/Translation';
import { DeviceConfirmImage, Modal, ModalProps } from 'src/components/suite';
import { TrezorDevice } from 'src/types/suite';

const Divider = styled.div`
    margin-bottom: 10px;
`;

const StyledModal = styled(Modal)`
    width: 360px;
`;

interface PinInvalidModalProps extends ModalProps {
    device: TrezorDevice;
}

export const PinInvalidModal = ({ device, ...rest }: PinInvalidModalProps) => (
    <StyledModal
        heading={
            <Translation id="TR_ENTERED_PIN_NOT_CORRECT" values={{ deviceLabel: device.label }} />
        }
        {...rest}
    >
        <DeviceConfirmImage device={device} />
        <Divider />
        <P type="hint">
            <Translation id="TR_RETRYING_DOT_DOT" />
        </P>
    </StyledModal>
);
