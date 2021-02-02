import React from 'react';
import styled from 'styled-components';
import { variables, H2, Button, Card } from '@trezor/components';
import { Translation, Image } from '@suite-components';
import { useActions, useSelector, useAnalytics } from '@suite-hooks';
import { Account } from '@wallet-types';
import * as suiteActions from '@suite-actions/suiteActions';
import * as routerActions from '@suite-actions/routerActions';
import Bech32Banner from './components/Bech32Banner';
import { getBip43Shortcut } from '@wallet-utils/accountUtils';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const StyledCard = styled(Card)`
    width: 100%;
    align-items: center;
`;

const Title = styled(H2)`
    text-align: center;
    font-weight: 600;
    margin-bottom: 16px;
`;

const Description = styled.span`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: 500;
    text-align: center;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const StyledImage = styled(props => <Image {...props} />)`
    width: 85px;
    height: 80px;
    margin-top: 60px;
    margin-bottom: 28px;
`;

const Actions = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    margin-bottom: 20px;
`;

const ActionButton = styled(Button)`
    min-width: 160px;

    & + & {
        margin-left: 20px;
    }
`;

const Divider = styled.div`
    width: 100%;
    height: 1px;
    background: ${props => props.theme.STROKE_GREY};
    margin: 30px 0px 36px 0px;
`;

interface Props {
    account: Account;
}

const AccountEmpty = (props: Props) => {
    const bech32BannerClosed = useSelector(state => state.suite.flags.bech32BannerClosed);
    const { goto, setFlag } = useActions({
        goto: routerActions.goto,
        setFlag: suiteActions.setFlag,
    });
    const bip43 = getBip43Shortcut(props.account.path);
    const networkSymbol = props.account.symbol.toUpperCase();
    const analytics = useAnalytics();

    return (
        <Wrapper>
            {bip43 === 'bech32' && !bech32BannerClosed && (
                <Bech32Banner
                    onClose={() => {
                        setFlag('bech32BannerClosed', true);
                    }}
                />
            )}
            <StyledCard>
                <StyledImage image="EMPTY_WALLET_NEUE" />
                <Title>
                    <Translation id="TR_ACCOUNT_IS_EMPTY_TITLE" />
                </Title>
                <Description>
                    <Translation
                        id="TR_ACCOUNT_IS_EMPTY_DESCRIPTION"
                        values={{ network: networkSymbol }}
                    />
                </Description>
                <Divider />
                <Actions>
                    <ActionButton
                        variant="secondary"
                        onClick={() => {
                            goto('wallet-receive', undefined, true);
                        }}
                    >
                        <Translation id="TR_RECEIVE_NETWORK" values={{ network: networkSymbol }} />
                    </ActionButton>
                    <ActionButton
                        variant="primary"
                        onClick={() => {
                            goto('wallet-coinmarket-buy', undefined, true);
                            analytics.report({
                                type: 'accounts/empty-account/buy',
                                payload: {
                                    symbol: networkSymbol,
                                },
                            });
                        }}
                    >
                        <Translation id="TR_BUY_NETWORK" values={{ network: networkSymbol }} />
                    </ActionButton>
                </Actions>
            </StyledCard>
        </Wrapper>
    );
};

export default AccountEmpty;
