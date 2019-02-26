/* @flow */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import colors from 'config/colors';
import { FONT_SIZE } from 'config/variables';

import { H3 } from 'components/Heading';
import P from 'components/Paragraph';

import type { Props } from '../../Container';

const Wrapper = styled.div`
    max-width: 390px;
`;

const Header = styled.div`
    padding: 30px 48px;
`;

const Content = styled.div`
    border-top: 1px solid ${colors.DIVIDER};
    background: ${colors.MAIN};
    padding: 24px 48px;
`;

const Label = styled.div`
    font-size: ${FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
`;

const ConfirmAddress = (props: Props) => {
    const {
        account,
        network,
    } = props.selectedAccount;
    if (!account || !network) return null;

    return (
        <Wrapper>
            <Header>
                <H3>Confirm address on Trezor</H3>
                <P>Please compare your address on device with address shown bellow.</P>
            </Header>
            <Content>
                <P>{ account.descriptor }</P>
                <Label>{ network.symbol } account #{ (account.index + 1) }</Label>
            </Content>
        </Wrapper>
    );
};

ConfirmAddress.propTypes = {
    selectedAccount: PropTypes.object.isRequired,
};

export default ConfirmAddress;