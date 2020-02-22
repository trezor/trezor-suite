import React from 'react';
import styled from 'styled-components';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { colors, Button, variables } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';

const Wrapper = styled.div`
    display: flex;
    padding: 54px 42px;
    align-items: center;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex-direction: column;
    }
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
    text-align: center;
`;

const Image = styled.img`
    display: flex;
    width: 220px;
    height: 180px;
    margin-right: 52px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        margin-bottom: 20px;
    }
`;

const InlineButton = styled(Button)`
    display: inline-flex;
`;

const SecurityItem = styled.div`
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.BUTTON};

    & + & {
        margin-top: 12px;
    }
`;

type Props = React.HTMLAttributes<HTMLDivElement>;

const EmptyWallet = (props: Props) => {
    return (
        <Wrapper {...props} data-test="@dashboard/wallet-ready">
            <Image src={resolveStaticPath(`images/dashboard/empty-dashboard.svg`)} />
            <Content>
                <Title>
                    <Translation {...messages.TR_YOUR_WALLET_IS_READY_WHAT} />
                </Title>
                <SecurityItem>
                    <Translation {...messages.TR_ADDITIONAL_SECURITY_FEATURES} />
                    <InlineButton
                        variant="tertiary"
                        size="small"
                        icon="ARROW_RIGHT"
                        alignIcon="right"
                        onClick={() => {
                            console.log('do something');
                        }}
                    >
                        <Translation {...messages.TR_FINISH_ADVANCED_SECURITY} />
                    </InlineButton>
                </SecurityItem>
                <SecurityItem>
                    <Translation {...messages.TR_LOOKING_FOR_QUICK_EASY} />
                    <InlineButton
                        variant="tertiary"
                        size="small"
                        icon="ARROW_RIGHT"
                        alignIcon="right"
                        onClick={() => {
                            console.log('do something');
                        }}
                    >
                        Buy BTC
                    </InlineButton>
                </SecurityItem>
            </Content>
        </Wrapper>
    );
};

export default EmptyWallet;
