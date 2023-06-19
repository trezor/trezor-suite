import React from 'react';
import styled from 'styled-components';
import { H1, variables } from '@trezor/components';
import { Translation } from 'src/components/suite/Translation';
import { DeviceConfirmImage } from 'src/components/suite/images/DeviceConfirmImage';
import { TrezorDevice } from 'src/types/suite';
import {
    DevicePromptModal,
    DevicePromptModalProps,
} from 'src/components/suite/Modal/DevicePromptModal';

const StyledDevicePromptModal = styled(DevicePromptModal)`
    width: 360px;
`;

const StyledDeviceConfirmImage = styled(DeviceConfirmImage)`
    margin-top: -30px;
`;

const StyledH1 = styled(H1)`
    margin-top: 12px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface ConfirmActionProps extends DevicePromptModalProps {
    device: TrezorDevice;
}

export const ConfirmActionModal = ({ device, ...rest }: ConfirmActionProps) => (
    <StyledDevicePromptModal data-test="@suite/modal/confirm-action-on-device" {...rest}>
        <StyledDeviceConfirmImage device={device} />

        <StyledH1>
            <Translation id="TR_CONFIRM_ACTION_ON_YOUR" values={{ deviceLabel: device.label }} />
        </StyledH1>
    </StyledDevicePromptModal>
);
