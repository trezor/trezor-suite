/* @flow */

import React from 'react';
import styled from 'styled-components';

import colors from 'config/colors';
import icons from 'config/icons';

import Icon from 'components/Icon';
import Link from 'components/Link';
import { H3 } from 'components/Heading';
import P from 'components/Paragraph';

import type { Props as BaseProps } from '../../Container';

type Props = {
    onCancel: $ElementType<$ElementType<BaseProps, 'modalActions'>, 'onCancel'>;
}

const Wrapper = styled.div`
    width: 360px;
    padding: 24px 48px;
`;

const Header = styled.div``;

const StyledLink = styled(Link)`
    position: absolute;
    right: 15px;
    top: 10px;
`;

const Confirmation = (props: Props) => (
    <Wrapper>
        <StyledLink onClick={props.onCancel}>
            <Icon
                size={20}
                color={colors.TEXT_SECONDARY}
                icon={icons.CLOSE}
            />
        </StyledLink>
        <Header>
            <Icon icon={icons.T1} size={60} color={colors.TEXT_SECONDARY} />
            <H3>NEM Wallet</H3>
            <P isSmaller>If you enter a wrong passphrase, you will not unlock the desired hidden wallet.</P>
        </Header>
    </Wrapper>
);

export default Confirmation;