import React from 'react';
import colors from 'config/colors';
import styled from 'styled-components';
import P from 'components/Paragraph';
import { H3 } from 'components/Heading';

const Wrapper = styled.div`
    width: 390px;
`;

const Header = styled.div`
`;

const Content = styled.div`
    border-top: 1px solid ${colors.DIVIDER};
    background: ${colors.MAIN};
    padding: 24px 48px;
`;

const Label = styled.div`
    font-size: 10px;
    color: ${colors.TEXT_SECONDARY};
`;

const ConfirmSignTx = (props) => {
    if (!props.modal.opened) return null;
    const { device } = props.modal;

    const {
        amount,
        address,
        currency,
        total,
        selectedFeeLevel,
    } = props.sendForm;

    return (
        <Wrapper>
            <Header>
                <H3>Confirm transaction on { device.label } device</H3>
                <P>Details are shown on display</P>
            </Header>
            <Content>
                <Label>Send </Label>
                <P>{ `${amount} ${currency}` }</P>
                <Label>To</Label>
                <P>{ address }</P>
                <Label>Fee</Label>
                <P>{ selectedFeeLevel.label }</P>
            </Content>
        </Wrapper>
    );
};

export default ConfirmSignTx;