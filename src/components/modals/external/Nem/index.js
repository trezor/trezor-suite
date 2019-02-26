/* @flow */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import colors from 'config/colors';
import icons from 'config/icons';
import Icon from 'components/Icon';
import Link from 'components/Link';
import Button from 'components/Button';
import { H3, H4 } from 'components/Heading';
import P from 'components/Paragraph';
import coins from 'constants/coins';

import NemImage from './images/nem-download.png';
import type { Props as BaseProps } from '../../Container';

type Props = {
    onCancel: $ElementType<$ElementType<BaseProps, 'modalActions'>, 'onCancel'>;
}

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
            <Icon
                size={24}
                color={colors.TEXT_SECONDARY}
                icon={icons.CLOSE}
            />
        </StyledLink>
        <H3>NEM Wallet</H3>
        <P isSmaller>We have partnered up with the NEM Foundation to provide you with a full-fledged NEM Wallet.</P>
        <H4>Make sure you download the Universal Client for Trezor support.</H4>
        <Img src={NemImage} />
        <Link href={coins.find(i => i.id === 'xem').url}>
            <StyledButton>Go to nem.io</StyledButton>
        </Link>
    </Wrapper>
);

NemWallet.propTypes = {
    onCancel: PropTypes.func.isRequired,
};

export default NemWallet;