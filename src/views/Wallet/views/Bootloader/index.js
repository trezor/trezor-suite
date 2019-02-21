import React from 'react';
import styled from 'styled-components';
import { H1 } from 'components/Heading';
import P from 'components/Paragraph';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import l10nMessages from './index.messages';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding: 40px 35px 40px 35px;
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 50px 0;
`;

const StyledP = styled(P)`
    padding: 0 0 15px 0;
    text-align: center;
`;

const StyledH1 = styled(H1)`
    text-align: center;
`;

const Bootloader = () => (
    <Wrapper>
        <Row>
            <StyledH1><FormattedMessage {...l10nMessages.TR_YOUR_DEVICE_IS_IN_FIRMWARE} /></StyledH1>
            <StyledP><FormattedMessage {...l10nMessages.TR_PLEASE_RECONNECT_IT} /></StyledP>
        </Row>
    </Wrapper>
);

export default connect(null, null)(Bootloader);
