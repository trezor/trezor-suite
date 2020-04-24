import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import { P, Modal } from '@trezor/components';
import DeviceConfirmImage from '@suite-components/images/DeviceConfirmImage';
import { TrezorDevice } from '@suite-types';

const Divider = styled.div`
    margin-bottom: 10px;
`;

interface Props {
    device: TrezorDevice;
}

const PinInvalid = (props: Props) => (
    <Modal
        size="tiny"
        heading={
            <Translation
                id="TR_ENTERED_PIN_NOT_CORRECT"
                values={{ deviceLabel: props.device.label }}
            />
        }
    >
        <DeviceConfirmImage device={props.device} />
        <Divider />
        <P size="small">
            <Translation id="TR_RETRYING_DOT_DOT" />
        </P>
    </Modal>
);

export default PinInvalid;
