import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';

import { H5, P } from '@trezor/components';
import { TrezorDevice } from '@suite-types';

import l10nMessages from './messages';

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
            <H5>
                <Translation
                    {...l10nMessages.TR_DISCONNECT_DEVICE_HEADER}
                    values={{ label: device.label }}
                />
            </H5>
            <StyledP size="small">
                <Translation {...l10nMessages.TR_DISCONNECT_DEVICE_TEXT} />
            </StyledP>
        </Wrapper>
    );
};

export default DisconnectDevice;
