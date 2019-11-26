import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

import { H2, P } from '@trezor/components-v2';
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
            <H2>
                <FormattedMessage
                    {...l10nMessages.TR_DISCONNECT_DEVICE_HEADER}
                    values={{ label: device.label }}
                />
            </H2>
            <StyledP size="small">
                <FormattedMessage {...l10nMessages.TR_DISCONNECT_DEVICE_TEXT} />
            </StyledP>
        </Wrapper>
    );
};

export default DisconnectDevice;
