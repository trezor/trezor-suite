import React from 'react';
import styled from 'styled-components';
import { Account } from '@wallet-types';
import { FiatValue, FormattedCryptoAmount, AccountLabeling } from '@suite-components';
import { CoinLogo, variables } from '@trezor/components';
import { AccountNavigation } from './AccountNavigation';

const StyledAccountNavigation = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    /* overflow: hidden; */
    padding: 0;
    @media screen and (max-width: calc(${variables.SCREEN_SIZE.XL} - 80px)) {
        padding: 0 13px;
    }
`;

const Main = styled.div`
    display: flex;
    align-items: center;
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

interface AccountNavigationStickyProps {
    account?: Account;
}

export const AccountNavigationSticky: React.FC<AccountNavigationStickyProps> = ({ account }) => {
    if (!account) return null;

    const { symbol, formattedBalance } = account;

    return (
        <StyledAccountNavigation>
            <AccountNavigation
                account={account}
                filterPosition="secondary"
                dataTestSuffix="sticky"
                primaryContent={
                    <Main>
                        <CoinLogo size={22} symbol={symbol} />
                        <BalanceWrapperContainer>
                            <LabelWrapper>
                                <AccountLabeling account={account} />
                            </LabelWrapper>
                            <BalanceInner>
                                <Balance>
                                    <FormattedCryptoAmount
                                        value={formattedBalance}
                                        symbol={symbol}
                                    />
                                </Balance>
                                <StyledFiatValue>
                                    <FiatValue
                                        amount={formattedBalance}
                                        symbol={symbol}
                                        showApproximationIndicator
                                    >
                                        {({ value }) =>
                                            value ? (
                                                <FiatBalanceWrapper>{value}</FiatBalanceWrapper>
                                            ) : null
                                        }
                                    </FiatValue>
                                </StyledFiatValue>
                            </BalanceInner>
                        </BalanceWrapperContainer>
                    </Main>
                }
            />
        </StyledAccountNavigation>
    );
};
