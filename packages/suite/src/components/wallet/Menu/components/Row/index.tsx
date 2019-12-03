import React from 'react';
import { CoinLogo, colors, variables } from '@trezor/components';
import styled, { css } from 'styled-components';
import { getRoute } from '@suite-utils/router';
import { getTitleForNetwork, getTypeForNetwork } from '@wallet-utils/accountUtils';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { Link } from '@suite-components';
import { Account } from '@wallet-types';
import AccountNavigation from './components/AccountNavigation/Container';

const Wrapper = styled.div<{ selected: boolean }>`
    padding: 10px 20px;
    display: flex;
    flex-direction: row;
    transition: background-color 0.3s, color 0.3s;

    ${props =>
        props.selected &&
        css`
            /* TODO: add from components */
            background: #fafafa;
        `}
`;

const CoinName = styled.div`
    display: flex;
    align-items: center;
    height: 25px;
`;

const LogoWrapper = styled.div`
    padding-top: 2px;
    display: flex;
`;

const Left = styled.div`
    display: flex;
    justify-content: flex-start;
`;

const Right = styled.div`
    display: flex;
    flex-direction: column;
    font-size: ${variables.FONT_SIZE.BIG};
    color: ${colors.TEXT_PRIMARY};
    padding-left: 7px;
`;

const Label = styled.span`
    display: flex;
    height: 100%;
    padding: 2px 0 0 5px;
    align-items: center;
    text-transform: uppercase;
    font-size: ${variables.FONT_SIZE.COUNTER};
    color: ${colors.TEXT_SECONDARY};
`;

const LabelAddon = styled.span`
    padding-right: 2px;
`;

const Balance = styled.div`
    display: flex;
`;

const BalanceValue = styled.div``;

const BalanceSymbol = styled.div`
    padding-left: 5px;
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

const Row = React.memo(({ account, selected }: Props) => {
    const accountType = getTypeForNetwork(account.accountType);
    return (
        <Wrapper selected={selected}>
            <Left>
                <LogoWrapper>
                    <CoinLogo size={20} symbol={account.symbol} />
                </LogoWrapper>
            </Left>
            <Right>
                <StyledLink
                    href={getRoute('wallet-account-summary', {
                        symbol: account.symbol,
                        accountIndex: account.index,
                        accountType: account.accountType,
                    })}
                >
                    <CoinName>
                        <Translation {...getTitleForNetwork(account.symbol)} />
                        <Label>
                            {accountType && (
                                <LabelAddon>
                                    <Translation {...accountType} />
                                </LabelAddon>
                            )}
                            <Translation
                                {...(account.imported
                                    ? messages.TR_IMPORTED_ACCOUNT_HASH
                                    : messages.TR_ACCOUNT_HASH)}
                                values={{ number: String(account.index + 1) }}
                            />
                        </Label>
                    </CoinName>
                    <Balance>
                        <BalanceValue>{account.formattedBalance}</BalanceValue>
                        <BalanceSymbol>{account.symbol.toUpperCase()}</BalanceSymbol>
                    </Balance>
                </StyledLink>
                {selected && <AccountNavigation />}
            </Right>
        </Wrapper>
    );
});

export default Row;
