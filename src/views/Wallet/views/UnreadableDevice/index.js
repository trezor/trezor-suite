/* @flow */

import React from 'react';
import styled from 'styled-components';
import { Notification } from 'trezor-ui-components';
import { injectIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';
import l10nMessages from './index.messages';

const Wrapper = styled.div``;

const UnreadableDevice = ({ intl }: { intl: IntlShape }) => (
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
