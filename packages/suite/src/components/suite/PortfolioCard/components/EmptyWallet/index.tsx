import React from 'react';
import styled from 'styled-components';
import { colors, Button, variables } from '@trezor/components-v2';

const Wrapper = styled.div`
    display: flex;
    padding: 54px 42px;
    align-items: center;
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
`;

const Title = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.H2};
    color: ${colors.BLACK0};
    margin-bottom: 30px;
`;

const Image = styled.div`
    display: flex;
    width: 220px;
    height: 180px;
    background: #f5f5f5;
    margin-right: 52px;
`;

const SecurityItem = styled.div`
    display: flex;
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.BUTTON};
    flex-direction: row;

    & + & {
        margin-top: 12px;
    }
`;

export interface Props extends React.HTMLAttributes<HTMLDivElement> {}

const EmptyWallet = (props: Props) => {
    return (
        <Wrapper {...props}>
            <Image />
            <Content>
                <Title>Your Wallet is ready. What to do now?</Title>
                <SecurityItem>
                    Additional security features are waiting to be done.
                    <Button
                        variant="tertiary"
                        size="small"
                        onClick={() => {
                            console.log('do something');
                        }}
                    >
                        Finish advanced security
                    </Button>
                </SecurityItem>
                <SecurityItem>
                    Looking for a quick & easy way to buy BTC? We got you covered.
                    <Button
                        variant="tertiary"
                        size="small"
                        onClick={() => {
                            console.log('do something');
                        }}
                    >
                        Buy BTC
                    </Button>
                </SecurityItem>
            </Content>
        </Wrapper>
    );
};

export default EmptyWallet;
