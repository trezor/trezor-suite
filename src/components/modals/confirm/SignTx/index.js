import React from 'react';
import colors from 'config/colors';
import styled from 'styled-components';
import P from 'components/Paragraph';
import Icon from 'components/Icon';
import icons from 'config/icons';
import { H3 } from 'components/Heading';

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

const Label = styled.div`
    padding-top: 5px;
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
        selectedFeeLevel,
    } = props.sendForm;

    return (
        <Wrapper>
            <Header>
                <Icon icon={icons.T1} size={60} color={colors.TEXT_SECONDARY} />
                <H3>Confirm transaction on { device.label } device</H3>
                <P>Details are shown on display</P>
            </Header>
            <Content>
                <Label>Send</Label>
                <P>{`${amount} ${currency}` }</P>
                <Label>To</Label>
                <P>{ address }</P>
                <Label>Fee</Label>
                <P>{ selectedFeeLevel.label }</P>
            </Content>
        </Wrapper>
    );
};

export default ConfirmSignTx;