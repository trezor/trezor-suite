import React from 'react';
import styled from 'styled-components';
import { variables, colors } from '@trezor/components-v2';
import ModalWrapper from '@suite-components/ModalWrapper';
import { Translation } from '@suite-components/Translation';
import DeviceConfirmImage from '@suite-components/images/DeviceConfirmImage';
import { TrezorDevice } from '@suite-types';
import messages from '@suite/support/messages';

const Wrapper = styled(ModalWrapper)`
    max-width: 360px;
    flex-direction: column;
    text-align: center;
    align-items: center;
`;

const Title = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    text-align: center;
    color: ${colors.BLACK0};
    margin-bottom: 20px;
`;

interface Props {
    device: TrezorDevice;
}

const ConfirmAction = ({ device }: Props) => {
    return (
        <Wrapper data-test="@suite/modal/confirm-action-on-device">
            <Title>
                <Translation
                    {...messages.TR_CONFIRM_ACTION_ON_YOUR}
                    values={{ deviceLabel: device.label }}
                />
            </Title>
            <DeviceConfirmImage device={device} />
        </Wrapper>
    );
};

export default ConfirmAction;
