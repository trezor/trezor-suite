import { Translation } from '@suite-components/Translation';
import { TrezorDevice } from '@suite-types';
import messages from '@suite/support/messages';
import { Button, H2, P } from '@trezor/components-v2';
import React, { FunctionComponent } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import styled from 'styled-components';

interface Props {
    device: TrezorDevice;
    onForgetDevice: (device: TrezorDevice) => void;
    onCancel: () => void;
}

const Wrapper = styled.div`
    width: 360px;
    padding: 30px 48px;
`;

const StyledP = styled(P)`
    && {
        padding: 20px 0px;
    }
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;

    button + button {
        margin-top: 10px;
    }
`;

const ForgetDevice: FunctionComponent<Props> = ({ device, onForgetDevice, onCancel }) => {
    useHotkeys('enter', () => onForgetDevice(device));
    useHotkeys('esc', () => onCancel());

    return (
        <Wrapper>
            <H2>
                <Translation
                    {...messages.TR_FORGET_LABEL}
                    values={{
                        deviceLabel: device.instanceLabel,
                    }}
                />
            </H2>
            <StyledP size="small">
                <Translation {...messages.TR_FORGETTING_ONLY_REMOVES_THE_DEVICE_FROM} />
            </StyledP>
            <Row>
                <Button onClick={() => onForgetDevice(device)}>
                    <Translation {...messages.TR_FORGET_DEVICE} />
                </Button>
                <Button variant="secondary" onClick={onCancel}>
                    <Translation {...messages.TR_DONT_FORGET} />
                </Button>
            </Row>
        </Wrapper>
    );
};

export default ForgetDevice;
