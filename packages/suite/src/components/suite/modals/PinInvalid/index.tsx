import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import { P, H2 } from '@trezor/components';
import ModalWrapper from '@suite-components/ModalWrapper';
import DeviceConfirmImage from '@suite-components/images/DeviceConfirmImage';
import { TrezorDevice } from '@suite-types';

const Wrapper = styled(ModalWrapper)`
    flex-direction: column;
`;
const Divider = styled.div`
    margin-bottom: 10px;
`;

interface Props {
    device: TrezorDevice;
}

const PinInvalid = (props: Props) => (
    <Wrapper>
        <H2>
            <Translation
                {...messages.TR_ENTERED_PIN_NOT_CORRECT}
                values={{ deviceLabel: props.device.label }}
            />
        </H2>
        <DeviceConfirmImage device={props.device} />
        <Divider />
        <P size="small">
            <Translation id="TR_RETRYING_DOT_DOT" />
        </P>
    </Wrapper>
);

export default PinInvalid;
