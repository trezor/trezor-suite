import React from 'react';
import styled from 'styled-components';
import { colors, variables, H2, Button } from '@trezor/components';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';

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
    color: #000000;
`;

const Description = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    text-align: center;
    color: ${colors.BLACK50};
    margin-bottom: 10px;
`;

const Image = styled.img`
    width: 340px;
    height: 280px;
    margin-bottom: 40px;
`;

const Actions = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
`;

const ActionButton = styled(Button)`
    min-width: 160px;
`;

interface Props {
    receive: () => any;
    buy: () => any;
}

const NoTransactions = ({ receive, buy }: Props) => {
    return (
        <Wrapper>
            <Content>
                <Title>
                    <Translation {...messages.TR_ACCOUNT_IS_EMPTY} />
                </Title>
                <Description>
                    <Translation {...messages.TR_ONCE_YOU_SEND_OR_RECEIVE} />
                </Description>
                <Image src={resolveStaticPath(`images/wallet/wallet-empty.svg`)} />
                <Actions>
                    <ActionButton variant="secondary" onClick={receive}>
                        <Translation {...messages.TR_RECEIVE} />
                    </ActionButton>
                    <ActionButton variant="primary" onClick={buy}>
                        <Translation {...messages.TR_BUY} />
                    </ActionButton>
                </Actions>
            </Content>
        </Wrapper>
    );
};

export default NoTransactions;
