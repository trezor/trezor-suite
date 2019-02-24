/* @flow */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import colors from 'config/colors';
import { FONT_SIZE } from 'config/variables';

import { H3 } from 'components/Heading';
import P from 'components/Paragraph';
import { FormattedMessage } from 'react-intl';

import l10nCommonMessages from 'views/common.messages';

import l10nMessages from './index.messages';

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
                <H3>
                    <FormattedMessage {...l10nMessages.TR_CONFIRM_ADDRESS_ON_TREZOR} />
                </H3>
                <P>
                    <FormattedMessage {...l10nMessages.TR_PLEASE_COMPARE_YOUR_ADDRESS} />
                </P>
            </Header>
            <Content>
                <P>{ account.descriptor }</P>
                <Label>{ network.symbol }
                    <FormattedMessage {...l10nCommonMessages.TR_ACCOUNT_HASH} values={{ number: account.index + 1 }} />
                </Label>
            </Content>
        </Wrapper>
    );
};

ConfirmAddress.propTypes = {
    selectedAccount: PropTypes.object.isRequired,
};

export default ConfirmAddress;