/* @flow */
import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import Content from 'views/Wallet/components/Content';

import { CoinLogo, H4, P } from 'trezor-ui-components';

import { FormattedMessage } from 'react-intl';
import l10nMessages from './index.messages';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Row = styled.div`
    flex: 1;
    display: flex;
    padding: 50px 0;

    flex-direction: column;
    align-items: center;
`;

const StyledP = styled(P)`
    && {
        padding: 0 0 15px 0;
        text-align: center;
    }
`;

const Overlay = styled.div`
    display: flex;
    width: 100%;
    height: 40px;
    justify-content: center;
    align-items: center;
    opacity: 0.2;
    background: white;
`;

const StyledCoinLogo = styled(CoinLogo)`
    margin-right: 10px;

    &:last-child {
        margin-right: 0px;
    }
`;

const Dashboard = () => (
    <Content>
        <Wrapper>
            <Row data-test="Dashboard__page__content">
                <H4>
                    <FormattedMessage {...l10nMessages.TR_PLEASE_SELECT_YOUR} />
                </H4>
                <StyledP>
                    <FormattedMessage {...l10nMessages.TR_YOU_WILL_GAIN_ACCESS} />
                </StyledP>
                <Overlay>
                    <StyledCoinLogo network="eth" height={32} />
                    <StyledCoinLogo network="xrp" height={32} />
                </Overlay>
            </Row>
        </Wrapper>
    </Content>
);

export default connect(
    null,
    null
)(Dashboard);
