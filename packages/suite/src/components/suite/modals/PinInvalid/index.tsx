import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';

import { P, H5 } from '@trezor/components';

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
        <H5>
            <Translation
                {...l10nMessages.TR_ENTERED_PIN_NOT_CORRECT}
                values={{ deviceLabel: props.device.label }}
            />
        </H5>
        <P size="small">
            <Translation {...l10nMessages.TR_RETRYING_DOT_DOT} />
        </P>
    </Wrapper>
);

export default PinInvalid;
