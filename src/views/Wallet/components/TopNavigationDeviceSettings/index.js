import styled from 'styled-components';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import l10nCommonMessages from 'views/common.messages';

const Wrapper = styled.div``;

const AccountTabs = () => (
    <Wrapper>
        <FormattedMessage {...l10nCommonMessages.TR_DEVICE_SETTINGS} />
    </Wrapper>
);

export default AccountTabs;