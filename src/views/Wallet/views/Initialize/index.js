/* @flow */
import styled from 'styled-components';
import { H1 } from 'components/Heading';
import Button from 'components/Button';
import { getOldWalletUrl } from 'utils/url';
import Paragraph from 'components/Paragraph';
import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import l10nCommonMessages from 'views/common.messages';
import type { TrezorDevice } from 'flowtype';
import l10nMessages from './index.messages';


type Props = {
    device: ?TrezorDevice;
}

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

const A = styled.a``;

const StyledParagraph = styled(Paragraph)`
    padding: 0 0 15px 0;
    text-align: center;
`;

const Initialize = (props: Props) => (
    <Wrapper data-test="Page__device__not__initialized">
        <Row>
            <H1><FormattedMessage {...l10nMessages.TR_YOUR_DEVICE_IS_NOT_INITIALIZED} /></H1>
            <StyledParagraph><FormattedMessage {...l10nMessages.TR_PLEASE_USE_TO_START_INITIALIZATION} /></StyledParagraph>
            <A href={getOldWalletUrl(props.device)} target="_self">
                <Button><FormattedMessage {...l10nCommonMessages.TR_TAKE_ME_TO_BITCOIN_WALLET} /></Button>
            </A>
        </Row>
    </Wrapper>
);

export default connect(null, null)(Initialize);
