import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

import { P, H2 } from '@trezor/components-v2';

import { TrezorDevice } from '@suite-types';
import l10nMessages from './messages';

interface Props {
    device: TrezorDevice;
}

const Wrapper = styled.div`
    padding: 30px 48px;
`;

const PinInvalid = (props: Props) => (
    <Wrapper>
        <H2>
            <FormattedMessage
                {...l10nMessages.TR_ENTERED_PIN_NOT_CORRECT}
                values={{ deviceLabel: props.device.label }}
            />
        </H2>
        <P size="small">
            <FormattedMessage {...l10nMessages.TR_RETRYING_DOT_DOT} />
        </P>
    </Wrapper>
);

export default PinInvalid;
