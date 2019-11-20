import React from 'react';
import { CoinLogo, colors, variables } from '@trezor/components';
import styled, { css } from 'styled-components';
import { getRoute } from '@suite-utils/router';
import { getTitleForNetwork, getTypeForNetwork } from '@wallet-utils/accountUtils';
import { FormattedMessage } from 'react-intl';
import l10nCommonMessages from '@suite-views/index.messages';
import { Link } from '@suite-components';
import { Account } from '@wallet-types';
import AccountNavigation from './components/AccountNavigation';

const Wrapper = styled.div<{ selected: boolean }>`
    padding: 10px 20px;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    transition: background-color 0.3s, color 0.3s;
    justify-content: space-between;

    ${props =>
        props.selected &&
        css`
            /* TODO: add from components */
            background: #fafafa;
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

const Label = styled.span`
    display: flex;
    justify-content: center;
    text-transform: uppercase;
    padding-right: 3px;
    font-size: ${variables.FONT_SIZE.COUNTER};
    color: ${colors.TEXT_SECONDARY};
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

const Row = React.memo(({ account, selected }: Props) => {
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
                            <FormattedMessage {...getTitleForNetwork(account.symbol)} />
                        </CoinName>
                        <AccountIndex>
                            <Label>
                                {accountType && (
                                    <LabelAddon>
                                        <FormattedMessage {...accountType} />
                                    </LabelAddon>
                                )}
                                <FormattedMessage
                                    {...(account.imported
                                        ? l10nCommonMessages.TR_IMPORTED_ACCOUNT_HASH
                                        : l10nCommonMessages.TR_ACCOUNT_HASH)}
                                    values={{ number: String(account.index + 1) }}
                                />
                            </Label>
                        </AccountIndex>
                    </Name>
                </Left>
                {selected && <AccountNavigation />}
            </Wrapper>
        </StyledLink>
    );
});

export default Row;
