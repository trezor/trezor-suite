/* @flow */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

import { P, H5 } from 'trezor-ui-components';

import type { TrezorDevice } from 'flowtype';
import l10nMessages from './index.messages';

type Props = {
    device: TrezorDevice,
};

const Wrapper = styled.div`
    padding: 30px 48px;
`;

const InvalidPin = (props: Props) => (
    <Wrapper>
        <H5>
            <FormattedMessage
                {...l10nMessages.TR_ENTERED_PIN_NOT_CORRECT}
                values={{ deviceLabel: props.device.label }}
            />
        </H5>
        <P small="size">
            <FormattedMessage {...l10nMessages.TR_RETRYING_DOT_DOT} />
        </P>
    </Wrapper>
);

InvalidPin.propTypes = {
    device: PropTypes.object.isRequired,
};

export default InvalidPin;
