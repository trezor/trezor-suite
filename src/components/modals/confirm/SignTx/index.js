/* @flow */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import icons from 'config/icons';
import colors from 'config/colors';
import { LINE_HEIGHT } from 'config/variables';

import P from 'components/Paragraph';
import Icon from 'components/Icon';
import { H3 } from 'components/Heading';

import type { TrezorDevice } from 'flowtype';
import type { Props as BaseProps } from '../../Container';

type Props = {
    device: TrezorDevice;
    sendForm: $ElementType<BaseProps, 'sendForm'>;
}

const Wrapper = styled.div`
    width: 390px;
    padding: 12px 10px;
`;

const Header = styled.div`
    padding: 24px 48px;
`;

const Content = styled.div`
    border-top: 1px solid ${colors.DIVIDER};
    background: ${colors.MAIN};
    padding: 24px 48px;
`;

const StyledP = styled(P)`
    word-wrap: break-word;
    padding: 5px 0;
    line-height: ${LINE_HEIGHT.SMALL};
`;

const Label = styled.div`
    padding-top: 5px;
    font-size: 10px;
    color: ${colors.TEXT_SECONDARY};
`;

const ConfirmSignTx = (props: Props) => {
    const {
        amount,
        address,
        currency,
        selectedFeeLevel,
    } = props.sendForm;

    return (
        <Wrapper>
            <Header>
                <Icon icon={icons.T1} size={60} color={colors.TEXT_SECONDARY} />
                <H3>Confirm transaction on { props.device.label } device</H3>
                <P isSmaller>Details are shown on display</P>
            </Header>
            <Content>
                <Label>Send</Label>
                <P>{`${amount} ${currency}` }</P>
                <Label>To</Label>
                <StyledP>{ address }</StyledP>
                <Label>Fee</Label>
                <P>{ selectedFeeLevel.label }</P>
            </Content>
        </Wrapper>
    );
};

ConfirmSignTx.propTypes = {
    device: PropTypes.object.isRequired,
    sendForm: PropTypes.object.isRequired,
};

export default ConfirmSignTx;