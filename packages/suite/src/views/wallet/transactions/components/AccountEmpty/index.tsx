import React from 'react';
import styled from 'styled-components';
import { variables, H2, Button } from '@trezor/components';
import { Translation, Image } from '@suite-components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 520px;
`;

const Title = styled(H2)`
    display: flex;
    text-align: center;
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const Description = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    text-align: center;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-bottom: 10px;
`;

const StyledImage = styled(props => <Image {...props} />)`
    width: 340px;
    height: 280px;
    margin-bottom: 40px;
`;

const Actions = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
`;

const ActionButton = styled(Button)`
    min-width: 160px;
`;

interface Props {
    receive: () => any;
}

const AccountEmpty = ({ receive }: Props) => (
    <Wrapper>
        <Content>
            <Title>
                <Translation id="TR_ACCOUNT_IS_EMPTY" />
            </Title>
            <Description>
                <Translation id="TR_ONCE_YOU_SEND_OR_RECEIVE" />
            </Description>
            <StyledImage image="EMPTY_WALLET" />
            <Actions>
                <ActionButton variant="primary" onClick={receive}>
                    <Translation id="TR_RECEIVE" />
                </ActionButton>
            </Actions>
        </Content>
    </Wrapper>
);

export default AccountEmpty;
