import React from 'react';
import styled from 'styled-components';
import { variables, colors } from '@trezor/components';
import ModalWrapper from '@suite-components/ModalWrapper';
import { Translation } from '@suite-components/Translation';
import DeviceConfirmImage from '@suite-components/images/DeviceConfirmImage';
import { TrezorDevice } from '@suite-types';

const Wrapper = styled(ModalWrapper)`
    max-width: 360px;
    flex-direction: column;
    text-align: center;
    align-items: center;
    margin: auto;
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
                    id="TR_CONFIRM_ACTION_ON_YOUR"
                    values={{ deviceLabel: device.label }}
                />
            </Title>
            <DeviceConfirmImage device={device} />
        </Wrapper>
    );
};

export default ConfirmAction;
