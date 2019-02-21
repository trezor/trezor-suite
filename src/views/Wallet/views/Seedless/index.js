import styled from 'styled-components';
import { H1 } from 'components/Heading';
import Paragraph from 'components/Paragraph';
import React from 'react';
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

const StyledParagraph = styled(Paragraph)`
    padding: 0 0 15px 0;
    text-align: center;
`;

const Seedless = () => (
    <Wrapper>
        <Row>
            <H1><FormattedMessage {...l10nMessages.TR_DEVICE_IS_IN_SEEDLESS} /></H1>
            <StyledParagraph><FormattedMessage {...l10nMessages.TR_DEVICE_IS_INITIALIZED_IN_SEEDLESS_MODE} /></StyledParagraph>
        </Row>
    </Wrapper>
);

export default connect(null, null)(Seedless);
