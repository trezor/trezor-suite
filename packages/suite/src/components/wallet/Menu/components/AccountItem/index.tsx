import React from 'react';
import { CoinLogo, colors, variables } from '@trezor/components';
import styled, { css } from 'styled-components';
import { getTitleForNetwork, getAccountFiatBalance } from '@wallet-utils/accountUtils';
import { Translation } from '@suite-components/Translation';
import { CoinBalance } from '@wallet-components';
import { FormattedNumber, HiddenPlaceholder } from '@suite-components';
import AccountNavigation from './components/AccountNavigation/Container';
import Badge from '@suite-components/Badge';
import { Props } from './Container';

const Wrapper = styled.div<{ selected: boolean }>`
    margin: 0px 10px 1px 10px;
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
    padding-left: 8px;
    width: 100%;
    min-width: 0; /* this makes text-overflow on label work */
`;

const AccountName = styled.div`
    overflow-x: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 16px;
    letter-spacing: -0.2px;
    color: ${colors.BLACK50};
    display: flex;
    justify-content: space-between;
`;

const AccountNumber = styled.div``;

// const LabelAddon = styled.span`
//     padding-right: 2px;
// `;

const Balance = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    font-weight: normal;
    color: #000;
    margin-top: 2px;
    flex-wrap: wrap;
`;

const AccountHeader = styled.div<{ selected: boolean }>`
    display: flex;
    padding: 10px;
    border-radius: 10px;
    cursor: pointer;

    ${props =>
        !props.selected &&
        css`
            &:hover {
                background: ${colors.BLACK96};
            }
        `}
`;

const StyledBadge = styled(Badge)`
    font-size: ${variables.FONT_SIZE.TINY};
`;

const AccountItem = React.memo((props: Props) => {
    const { account, selected } = props;
    // const accountType = getTypeForNetwork(account.accountType);
    const fiatBalance = getAccountFiatBalance(account, props.localCurrency, props.fiat);

    // const accountName = (
    //     <>
    //         <Translation {...getTitleForNetwork(account.symbol)} />
    //         {accountType && (
    //             <LabelAddon>
    //                 <Translation {...accountType} />
    //             </LabelAddon>
    //         )}{' '}
    //         <Translation
    //             {...(account.imported
    //                 ? messages.TR_IMPORTED_ACCOUNT_HASH
    //                 : messages.TR_ACCOUNT_HASH)}
    //             values={{ number: String(account.index + 1) }}
    //         />
    //     </>
    // );

    return (
        <Wrapper selected={selected}>
            <AccountHeader
                selected={selected}
                onClick={() =>
                    props.goto('wallet-index', {
                        symbol: account.symbol,
                        accountIndex: account.index,
                        accountType: account.accountType,
                    })
                }
            >
                <Left>
                    <LogoWrapper>
                        <CoinLogo size={16} symbol={account.symbol} />
                    </LogoWrapper>
                </Left>
                <Right>
                    <AccountName>
                        <Translation {...getTitleForNetwork(account.symbol)} />
                        <AccountNumber># {account.index + 1}</AccountNumber>
                    </AccountName>

                    <Balance>
                        <HiddenPlaceholder>
                            <CoinBalance value={account.formattedBalance} symbol={account.symbol} />
                        </HiddenPlaceholder>
                        {fiatBalance && (
                            <HiddenPlaceholder>
                                <StyledBadge>
                                    <FormattedNumber
                                        value={fiatBalance}
                                        currency={props.localCurrency}
                                    />
                                </StyledBadge>
                            </HiddenPlaceholder>
                        )}
                    </Balance>
                </Right>
            </AccountHeader>
            {selected && <AccountNavigation />}
        </Wrapper>
    );
});

export default AccountItem;
