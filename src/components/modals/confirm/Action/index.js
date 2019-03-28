/* @flow */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { H6 } from 'trezor-ui-components';
import DeviceIcon from 'components/images/DeviceIcon';
import type { TrezorDevice } from 'flowtype';
import { FormattedMessage } from 'react-intl';

import l10nMessages from './index.messages';

type Props = {
    device: TrezorDevice,
};

const Wrapper = styled.div``;

const Header = styled.div`
    padding: 48px;
`;

const StyledDeviceIcon = styled(DeviceIcon)`
    margin-bottom: 30px;
`;

const ConfirmAction = (props: Props) => (
    <Wrapper>
        <Header>
            <StyledDeviceIcon device={props.device} size={50} />
            <H6>
                <FormattedMessage {...l10nMessages.TR_CONFIRM_ACTION_ON_YOUR} />
            </H6>
        </Header>
    </Wrapper>
);

ConfirmAction.propTypes = {
    device: PropTypes.object.isRequired,
};

export default ConfirmAction;
