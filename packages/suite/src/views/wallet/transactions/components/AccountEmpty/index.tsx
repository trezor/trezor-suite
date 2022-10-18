import React from 'react';
import styled from 'styled-components';
import { analytics, EventType } from '@trezor/suite-analytics';

import { variables, H2, Button, Card, Image } from '@trezor/components';
import { Translation } from '@suite-components';
import { useActions, useSelector } from '@suite-hooks';
import { Account } from '@wallet-types';
import * as suiteActions from '@suite-actions/suiteActions';
import * as routerActions from '@suite-actions/routerActions';
import Bech32Banner from './components/Bech32Banner';
import TaprootBanner from './components/TaprootBanner';
import { getBip43Type } from '@suite-common/wallet-utils';

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
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const StyledImage = styled(Image)`
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
    background: ${({ theme }) => theme.STROKE_GREY};
    margin: 30px 0px 36px 0px;
`;

interface AccountEmptyProps {
    account: Account;
}

export const AccountEmpty = (props: AccountEmptyProps) => {
    const { bech32BannerClosed, taprootBannerClosed } = useSelector(state => state.suite.flags);

    const { goto, setFlag } = useActions({
        goto: routerActions.goto,
        setFlag: suiteActions.setFlag,
    });

    const bip43 = getBip43Type(props.account.path);
    const networkSymbol = props.account.symbol.toUpperCase();

    const handleNavigateToReceivePage = () => {
        goto('wallet-receive', { preserveParams: true });
        analytics.report({
            type: EventType.AccountsEmptyAccountReceive,
            payload: {
                symbol: networkSymbol.toLowerCase(),
            },
        });
    };

    const handleNavigateToBuyPage = () => {
        goto('wallet-coinmarket-buy', { preserveParams: true });

        analytics.report({
            type: EventType.AccountsEmptyAccountBuy,
            payload: {
                symbol: networkSymbol.toLowerCase(),
            },
        });
    };

    return (
        <Wrapper>
            {bip43 === 'bip84' && !bech32BannerClosed && (
                <Bech32Banner onClose={() => setFlag('bech32BannerClosed', true)} />
            )}

            {bip43 === 'bip86' && !taprootBannerClosed && (
                <TaprootBanner onClose={() => setFlag('taprootBannerClosed', true)} />
            )}

            <StyledCard>
                <StyledImage image="CLOUDY" />

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
                        data-test="@accounts/empty-account/receive"
                        variant="secondary"
                        onClick={handleNavigateToReceivePage}
                    >
                        <Translation id="TR_RECEIVE_NETWORK" values={{ network: networkSymbol }} />
                    </ActionButton>

                    <ActionButton
                        data-test="@accounts/empty-account/buy"
                        variant="primary"
                        onClick={handleNavigateToBuyPage}
                    >
                        <Translation id="TR_BUY_NETWORK" values={{ network: networkSymbol }} />
                    </ActionButton>
                </Actions>
            </StyledCard>
        </Wrapper>
    );
};
