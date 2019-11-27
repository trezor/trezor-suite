import React, { FunctionComponent } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import styled from 'styled-components';

import { H5, P } from '@trezor/components';
import { Button } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';

import l10nCommonMessages from '@suite-views/index.messages';
import l10nDeviceMessages from '../messages';
import l10nMessages from './messages';
import { TrezorDevice } from '@suite-types';

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
            <H5>
                <Translation
                    {...l10nDeviceMessages.TR_FORGET_LABEL}
                    values={{
                        deviceLabel: device.instanceLabel,
                    }}
                />
            </H5>
            <StyledP size="small">
                <Translation {...l10nMessages.TR_FORGETTING_ONLY_REMOVES_THE_DEVICE_FROM} />
            </StyledP>
            <Row>
                <Button onClick={() => onForgetDevice(device)} inlineWidth>
                    <Translation {...l10nCommonMessages.TR_FORGET_DEVICE} />
                </Button>
                <Button variant="secondary" onClick={onCancel} inlineWidth>
                    <Translation {...l10nMessages.TR_DONT_FORGET} />
                </Button>
            </Row>
        </Wrapper>
    );
};

export default ForgetDevice;
