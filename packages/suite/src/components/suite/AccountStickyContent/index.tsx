import React from 'react';
import styled from 'styled-components';
import { FiatValue, FormattedCryptoAmount, AccountLabeling, Translation } from '@suite-components';
import { CoinLogo, variables } from '@trezor/components';
import { Account } from '@wallet-types';
import { Route } from '@suite-constants/routes';

const Main = styled.div`
    align-items: center;
    display: flex;
`;

const BalanceWrapperContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin: 0 0 0 13px;
`;

const Balance = styled.div`
    white-space: nowrap;
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const FiatBalanceWrapper = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-left: 0.5ch;
`;

const LabelWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0 13px 0 0;
`;

const BalanceInner = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledFiatValue = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledFormTitle = styled.h3`
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const StyledSeparator = styled.span`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: 31px;
    font-family: initial;
    display: inline-block;
    line-height: 1;
    padding: 0 8px;
`;

interface AccountStickyContentProps {
    account?: Account;
    routeName: Route['name'];
}
const AccountStickyContent = ({ account, routeName }: AccountStickyContentProps) => {
    if (!account) return null;

    const { symbol, formattedBalance } = account;

    const headerText = () => {
        if (!routeName) return;

        if (routeName === 'wallet-send') {
            return <Translation id="TR_NAV_SEND" />;
        }
        if (routeName === 'wallet-receive') {
            return <Translation id="TR_NAV_RECEIVE" />;
        }
        if (routeName.startsWith('wallet-coinmarket')) {
            return <Translation id="TR_NAV_TRADE" />;
        }
        if (routeName === 'wallet-sign-verify') {
            return <Translation id="TR_NAV_SIGN_VERIFY" />;
        }
    };

    return (
        <Main>
            <CoinLogo size={22} symbol={symbol} />
            <BalanceWrapperContainer>
                <LabelWrapper>
                    <StyledFormTitle>{headerText()}</StyledFormTitle>
                    <StyledSeparator>&#183;</StyledSeparator>
                    <AccountLabeling account={account} />
                </LabelWrapper>
                <BalanceInner>
                    <Balance>
                        <FormattedCryptoAmount value={formattedBalance} symbol={symbol} />
                    </Balance>
                    <StyledFiatValue>
                        <FiatValue
                            amount={formattedBalance}
                            symbol={symbol}
                            showApproximationIndicator
                        >
                            {({ value }) =>
                                value ? <FiatBalanceWrapper>{value}</FiatBalanceWrapper> : null
                            }
                        </FiatValue>
                    </StyledFiatValue>
                </BalanceInner>
            </BalanceWrapperContainer>
        </Main>
    );
};

export default AccountStickyContent;
