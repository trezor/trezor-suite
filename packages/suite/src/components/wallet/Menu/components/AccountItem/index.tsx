import React from 'react';
import { CoinLogo, colors, variables } from '@trezor/components';
import styled, { css } from 'styled-components';
import { getRoute } from '@suite-utils/router';
import {
    getTitleForNetwork,
    getTypeForNetwork,
    getAccountBalance,
} from '@wallet-utils/accountUtils';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { Link, FormattedNumber } from '@suite-components';
import AccountNavigation from './components/AccountNavigation/Container';
import Badge from '@suite/components/suite/Badge';
import { Props } from './Container';

const Wrapper = styled.div<{ selected: boolean }>`
    margin: 0px 10px 5px 10px;
    padding: 10px;
    display: flex;
    border-radius: 10px;
    flex-direction: column;
    transition: background-color 0.3s, color 0.3s;

    ${props =>
        props.selected &&
        css`
            /* TODO: add from components */
            background: #f5f5f5;
        `}
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
    padding-left: 8px;
`;

const Label = styled.span`
    display: flex;
    white-space: nowrap;
    color: ${colors.TEXT_SECONDARY};
    font-size: 16px;
    letter-spacing: -0.2px;
    color: #808080;
`;

const LabelAddon = styled.span`
    padding-right: 2px;
`;

const Balance = styled.div`
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: normal;
    color: #000;
    margin-top: 2px;
    flex-wrap: wrap;
`;

const CryptoValue = styled.div`
    margin-right: 12px;
    white-space: nowrap;
`;

const AccountHeader = styled.div`
    display: flex;
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

const StyledBadge = styled(Badge)`
    background: #ebebeb;
`;

const AccountItem = React.memo((props: Props) => {
    const { account, selected } = props;
    const accountType = getTypeForNetwork(account.accountType);
    const fiatBalance = getAccountBalance(account, props.localCurrency, props.fiat);

    return (
        <Wrapper selected={selected}>
            <AccountHeader>
                <Left>
                    <LogoWrapper>
                        <CoinLogo size={16} symbol={account.symbol} />
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
                        <Label>
                            <Translation {...getTitleForNetwork(account.symbol)} />
                            {accountType && (
                                <LabelAddon>
                                    <Translation {...accountType} />
                                </LabelAddon>
                            )}{' '}
                            <Translation
                                {...(account.imported
                                    ? messages.TR_IMPORTED_ACCOUNT_HASH
                                    : messages.TR_ACCOUNT_HASH)}
                                values={{ number: String(account.index + 1) }}
                            />
                        </Label>
                        <Balance>
                            <CryptoValue>
                                {account.formattedBalance} {account.symbol.toUpperCase()}
                            </CryptoValue>
                            {fiatBalance && (
                                <StyledBadge>
                                    <FormattedNumber
                                        value={fiatBalance}
                                        currency={props.localCurrency}
                                    />
                                </StyledBadge>
                            )}
                        </Balance>
                    </StyledLink>
                </Right>
            </AccountHeader>
            {selected && <AccountNavigation />}
        </Wrapper>
    );
});

export default AccountItem;
