/* @flow */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { H5, Button, P, Icon, Link, icons, colors } from 'trezor-ui-components';
import coins from 'constants/coins';

import l10nCommonMessages from '../common.messages';
import l10nMessages from './index.messages';

import CardanoImage from './images/cardano.png';
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
    max-width: 100px;
    margin: 0 auto;
    height: auto;
    padding-bottom: 20px;
`;

const CardanoWallet = (props: Props) => (
    <Wrapper>
        <StyledLink onClick={props.onCancel}>
            <Icon size={12} color={colors.TEXT_SECONDARY} icon={icons.CLOSE} />
        </StyledLink>
        <Img src={CardanoImage} />
        <H5>
            <FormattedMessage {...l10nMessages.TR_CARDANO_WALLET} />
        </H5>
        <P size="small">
            <FormattedMessage {...l10nCommonMessages.TR_YOU_WILL_BE_REDIRECTED_TO_EXTERNAL} />
        </P>

        <Link href={coins.find(i => i.id === 'ada').url}>
            <StyledButton onClick={props.onCancel}>
                <FormattedMessage {...l10nCommonMessages.TR_GO_TO_EXTERNAL_WALLET} />
            </StyledButton>
        </Link>
    </Wrapper>
);

CardanoWallet.propTypes = {
    onCancel: PropTypes.func.isRequired,
};

export default CardanoWallet;
