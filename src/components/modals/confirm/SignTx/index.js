/* @flow */

import React from 'react';
import styled from 'styled-components';
import colors from 'config/colors';
import P from 'components/Paragraph';
import Icon from 'components/Icon';
import icons from 'config/icons';
import { H3 } from 'components/Heading';
import { LINE_HEIGHT } from 'config/variables';

import type { Props } from '../../index';

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
    if (!props.modal.opened) return null;
    const { device } = props.modal;

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
                <H3>Confirm transaction on { device.label } device</H3>
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

export default ConfirmSignTx;