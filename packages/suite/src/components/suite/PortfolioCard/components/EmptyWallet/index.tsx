import React from 'react';
import styled from 'styled-components';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { colors, Button, variables } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';

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

const Image = styled.img`
    display: flex;
    width: 220px;
    height: 180px;
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

type Props = React.HTMLAttributes<HTMLDivElement>;

const EmptyWallet = (props: Props) => {
    return (
        <Wrapper {...props}>
            <Image src={resolveStaticPath(`images/dashboard/empty-dashboard.svg`)} />
            <Content>
                <Title>
                    <Translation {...messages.TR_YOUR_WALLET_IS_READY_WHAT} />
                </Title>
                <SecurityItem>
                    <Translation {...messages.TR_ADDITIONAL_SECURITY_FEATURES} />
                    <Button
                        variant="tertiary"
                        size="small"
                        onClick={() => {
                            console.log('do something');
                        }}
                    >
                        <Translation {...messages.TR_FINISH_ADVANCED_SECURITY} />
                    </Button>
                </SecurityItem>
                <SecurityItem>
                    <Translation {...messages.TR_LOOKING_FOR_QUICK_EASY} />
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
