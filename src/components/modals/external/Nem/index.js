/* @flow */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { H5, Button, P, Icon, Link, icons, colors } from 'trezor-ui-components';

import coins from 'constants/coins';
import { FormattedMessage } from 'react-intl';

import l10nMessages from './index.messages';
import NemImage from './images/nem-download.png';
import type { Props as BaseProps } from '../../Container';

type Props = {
    onCancel: $ElementType<$ElementType<BaseProps, 'modalActions'>, 'onCancel'>,
};

const Wrapper = styled.div`
    width: 100%;
    max-width: 620px;
    padding: 30px 48px;
`;

const StyledButton = styled(Button)`
    margin-top: 10px;
    width: 100%;
`;

const StyledLink = styled(Link)`
    position: absolute;
    right: 15px;
    top: 10px;
`;

const Img = styled.img`
    display: block;
    width: 100%;
    height: auto;
`;

const NemWallet = (props: Props) => (
    <Wrapper>
        <StyledLink onClick={props.onCancel}>
            <Icon size={12} color={colors.TEXT_SECONDARY} icon={icons.CLOSE} />
        </StyledLink>
        <H5>
            <FormattedMessage {...l10nMessages.TR_NEM_WALLET} />
        </H5>
        <P size="small">
            <FormattedMessage {...l10nMessages.TR_WE_HAVE_PARTNERED_UP_WITH_THE_NEM} />
            <br />
            <strong>
                <FormattedMessage {...l10nMessages.TR_MAKE_SURE_YOU_DOWNLOAD_THE_UNIVERSAL} />
            </strong>
        </P>
        <Img src={NemImage} />
        <Link href={coins.find(i => i.id === 'xem').url}>
            <StyledButton onClick={props.onCancel}>
                <FormattedMessage {...l10nMessages.TR_GO_TO_NEM_DOT_IO} />
            </StyledButton>
        </Link>
    </Wrapper>
);

NemWallet.propTypes = {
    onCancel: PropTypes.func.isRequired,
};

export default NemWallet;
