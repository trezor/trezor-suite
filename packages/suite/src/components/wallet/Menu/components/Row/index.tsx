import React from 'react';
import { CoinLogo, colors, variables } from '@trezor/components';
import styled, { css } from 'styled-components';
import { getRoute } from '@suite-utils/router';
import { getTitleForNetwork, getTypeForNetwork } from '@wallet-utils/accountUtils';
import { Translation } from '@suite-components/Translation';
import l10nCommonMessages from '@suite-views/index.messages';
import { Link } from '@suite-components';
import { Account } from '@wallet-types';

const Wrapper = styled.div<{ selected: boolean }>`
    padding: 0 20px;
    display: flex;
    height: 55px;
    cursor: pointer;
    transition: background-color 0.3s, color 0.3s;
    justify-content: space-between;

    &:hover {
        background-color: ${colors.GRAY_LIGHT};
    }

    &:first-child {
        padding-top: 0;
    }

    ${props =>
        props.selected &&
        css`
            padding-left: 17px;
            border-left: 3px solid ${colors.GREEN_PRIMARY};
            background-color: ${colors.WHITE};
            &:hover {
                background-color: ${colors.WHITE};
            }
        `}
`;

const CoinName = styled.div``;

const LogoWrapper = styled.div`
    min-width: 40px;
    display: flex;
    align-items: center;
`;

const AccountIndex = styled.div`
    display: flex;
    align-items: center;
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const BalanceValue = styled.div`
    text-transform: uppercase;
    font-size: ${variables.FONT_SIZE.BIG};
    text-align: right;
`;

const Left = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
`;

const Name = styled.div`
    display: flex;
    flex-direction: column;
    font-size: ${variables.FONT_SIZE.BIG};
    color: ${colors.TEXT_PRIMARY};
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    align-items: flex-end;
    justify-content: center;
    flex-direction: column;
`;

const Label = styled.span`
    display: flex;
    justify-content: center;
    text-transform: uppercase;
    padding-right: 3px;
    font-size: ${variables.FONT_SIZE.COUNTER};
    color: ${colors.TEXT_SECONDARY};
`;

const Balance = styled.div`
    display: flex;
    align-items: center;
`;

const Transactions = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.COUNTER};
    align-items: center;
`;

const TransactionsValue = styled.div`
    display: flex;
    padding-right: 2px;
    align-items: center;
`;

const LabelAddon = styled.span`
    padding-right: 2px;
`;

// todo make no style link component
const StyledLink = styled(Link)`
    display: flex;
    flex-direction: column;
    color: ${colors.TEXT_PRIMARY};

    &:focus,
    &:hover,
    &:visited,
    &:link,
    &:active {
        color: ${colors.TEXT_PRIMARY};
        text-decoration: none;
    }
`;

interface Props {
    account: Account;
    hideBalance: boolean;
    selected: boolean;
}

const Row = React.memo(({ account, hideBalance, selected }: Props) => {
    const accountType = getTypeForNetwork(account.accountType);
    return (
        <StyledLink
            href={getRoute('wallet-account-summary', {
                symbol: account.symbol,
                accountIndex: account.index,
                accountType: account.accountType,
            })}
        >
            <Wrapper selected={selected}>
                <Left>
                    <LogoWrapper>
                        <CoinLogo size={25} symbol={account.symbol} />
                    </LogoWrapper>
                    <Name>
                        <CoinName>
                            <Translation {...getTitleForNetwork(account.symbol)} />
                        </CoinName>
                        <AccountIndex>
                            <Label>
                                {accountType && (
                                    <LabelAddon>
                                        <Translation {...accountType} />
                                    </LabelAddon>
                                )}
                                <Translation
                                    {...(account.imported
                                        ? l10nCommonMessages.TR_IMPORTED_ACCOUNT_HASH
                                        : l10nCommonMessages.TR_ACCOUNT_HASH)}
                                    values={{ number: String(account.index + 1) }}
                                />
                            </Label>
                        </AccountIndex>
                    </Name>
                </Left>
                {!hideBalance && (
                    <Right>
                        <Balance>
                            <BalanceValue>
                                {account.formattedBalance} {account.symbol}
                            </BalanceValue>
                        </Balance>
                        {account.history.total !== -1 && (
                            <Transactions>
                                <Label>transactions</Label>
                                <TransactionsValue>
                                    {account.history.total + (account.history.unconfirmed || 0)}
                                </TransactionsValue>
                            </Transactions>
                        )}
                    </Right>
                )}
            </Wrapper>
        </StyledLink>
    );
});

export default Row;
