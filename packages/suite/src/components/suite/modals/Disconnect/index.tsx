import { Translation } from '@suite-components/Translation';
import { TrezorDevice } from '@suite-types';
import messages from '@suite/support/messages';
import { H2, P } from '@trezor/components-v2';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    width: 360px;
    padding: 30px 48px;
`;

const StyledP = styled(P)`
    && {
        padding: 20px 0px;
    }
`;

interface Props {
    device: TrezorDevice;
}

const DisconnectDevice = ({ device }: Props) => {
    return (
        <Wrapper>
            <H2>
                <Translation
                    {...messages.TR_DISCONNECT_DEVICE_HEADER}
                    values={{ label: device.label }}
                />
            </H2>
            <StyledP size="small">
                <Translation {...messages.TR_DISCONNECT_DEVICE_TEXT} />
            </StyledP>
        </Wrapper>
    );
};

export default DisconnectDevice;
