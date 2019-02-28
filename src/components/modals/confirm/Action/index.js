/* @flow */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { H3 } from 'components/Heading';
import DeviceIcon from 'components/images/DeviceIcon';
import type { TrezorDevice } from 'flowtype';
import { FormattedMessage } from 'react-intl';

import l10nMessages from './index.messages';

type Props = {
    device: TrezorDevice;
}

const Wrapper = styled.div``;

const Header = styled.div`
    padding: 48px;
`;

const ConfirmAction = (props: Props) => (
    <Wrapper>
        <Header>
            <DeviceIcon device={props.device} size={100} />
            <H3>
                <FormattedMessage {...l10nMessages.TR_CONFIRM_ACTION_ON_YOUR} />
            </H3>
        </Header>
    </Wrapper>
);

ConfirmAction.propTypes = {
    device: PropTypes.object.isRequired,
};


export default ConfirmAction;