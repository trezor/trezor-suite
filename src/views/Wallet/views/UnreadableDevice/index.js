/* @flow */

import React from 'react';
import styled from 'styled-components';
import Notification from 'components/Notification';
import { injectIntl } from 'react-intl';
import l10nMessages from './index.messages';


const Wrapper = styled.div``;

const UnreadableDevice = ({ intl }: { intl: any }) => (
    <Wrapper>
        <Notification
            title={intl.formatMessage(l10nMessages.TR_UNREADABLE_DEVICE)}
            message={intl.formatMessage(l10nMessages.TR_PLEASE_INSTALL_TREZOR_BRIDGE)}
            type="error"
            cancelable={false}
        />
    </Wrapper>
);

export default injectIntl(UnreadableDevice);
