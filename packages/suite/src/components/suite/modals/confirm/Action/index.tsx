import React from 'react';
import styled from 'styled-components';
import { Modal } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import DeviceConfirmImage from '@suite-components/images/DeviceConfirmImage';
import { TrezorDevice } from '@suite-types';

const Wrapper = styled.div`
    max-width: 360px;
    flex-direction: column;
    text-align: center;
    align-items: center;
    margin: auto;
`;

interface Props {
    device: TrezorDevice;
}

const ConfirmAction = ({ device }: Props) => {
    return (
        <Modal
            useFixedWidth={false}
            heading={
                <Translation
                    id="TR_CONFIRM_ACTION_ON_YOUR"
                    values={{ deviceLabel: device.label }}
                />
            }
        >
            <Wrapper data-test="@suite/modal/confirm-action-on-device">
                <DeviceConfirmImage device={device} />
            </Wrapper>
        </Modal>
    );
};

export default ConfirmAction;
