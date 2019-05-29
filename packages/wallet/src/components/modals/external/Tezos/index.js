/* @flow */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Button, H5, Link, P, Icon, icons, colors } from 'trezor-ui-components';
import coins from 'constants/coins';

import { FormattedMessage } from 'react-intl';
import TezosImage from './images/xtz.png';
import type { Props as BaseProps } from '../../Container';
import l10nCommonMessages from '../common.messages';
import l10nMessages from './index.messages';

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
    max-width: 100px;
    margin: 0 auto;
    height: auto;
    padding-bottom: 20px;
`;

const TezosWallet = (props: Props) => (
    <Wrapper>
        <StyledLink onClick={props.onCancel}>
            <Icon size={12} color={colors.TEXT_SECONDARY} icon={icons.CLOSE} />
        </StyledLink>
        <Img src={TezosImage} />
        <H5>
            <FormattedMessage {...l10nMessages.TR_TEZOS_WALLET} />
        </H5>
        <P size="small">
            <FormattedMessage {...l10nCommonMessages.TR_YOU_WILL_BE_REDIRECTED_TO_EXTERNAL} />
        </P>

        <Link href={coins.find(i => i.id === 'xtz').url}>
            <StyledButton onClick={props.onCancel}>
                <FormattedMessage {...l10nCommonMessages.TR_GO_TO_EXTERNAL_WALLET} />
            </StyledButton>
        </Link>
    </Wrapper>
);

TezosWallet.propTypes = {
    onCancel: PropTypes.func.isRequired,
};

export default TezosWallet;
