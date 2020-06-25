import React, { forwardRef } from 'react';
import { CoinLogo, colors, variables } from '@trezor/components';
import styled, { css } from 'styled-components';
import { getTitleForNetwork, getAccountFiatBalance } from '@wallet-utils/accountUtils';
import { Translation } from '@suite-components/Translation';
import { CoinBalance } from '@wallet-components';
import { FormattedNumber, HiddenPlaceholder } from '@suite-components';
import Badge from '@suite-components/Badge';
import { Props } from './Container';
import AnimationWrapper from '../AnimationWrapper';
import AccountNavigation from '../AccountNavigation';

// position: inherit - get position from parent (AccountGroup), it will be set after animation ends
// sticky top: 34, sticky header
const Wrapper = styled.div<{ selected: boolean; type: string }>`
    padding: 2px 0px 2px 0px;
    display: flex;
    flex-direction: column;
    &:first-of-type {
        padding-top: 0;
    }
    ${props =>
        props.selected &&
        css`
            border-radius: 4px;
            border-bottom: 0px;
            background: ${colors.BLACK96};
            position: inherit;
            top: ${props.type !== 'normal' ? '34px' : '0px'};
            bottom: 0px;
            z-index: 1;
            padding: 0px;
        `}
`;

const Row = styled.div`
    display: flex;
    align-items: center;
    text-overflow: ellipsis;
    white-space: nowrap;
    border-bottom: 2px solid ${colors.BLACK96};
    padding-bottom: 10px;
`;

const AccountName = styled.div`
    overflow-x: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 16px;
    font-weight: 500;
    color: ${colors.BLACK17};
    display: flex;
    justify-content: space-between;
    padding-bottom: 2px;
`;

const Balance = styled.div`
    padding-left: 8px;
    flex: 1;
    padding-top: 2px;
    font-size: 14px;
    font-weight: normal;
    color: #404040;
    flex-wrap: wrap;
`;

const AccountHeader = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px;
    padding-bottom: 0px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s, color 0.3s;
    &:hover {
        background: ${colors.BLACK96};
    }
`;

const StyledBadge = styled(Badge)`
    font-size: ${variables.FONT_SIZE.TINY};
`;

// Using `React.forwardRef` to be able to pass `ref` (item) TO parent (Menu/index)
const AccountItem = forwardRef((props: Props, ref: React.Ref<HTMLDivElement>) => {
    const { account, selected } = props;

    const fiatBalance = getAccountFiatBalance(account, props.localCurrency, props.fiat.coins);
    const accountLabel = account.metadata.accountLabel ? (
        <span>{account.metadata.accountLabel}</span>
    ) : (
        <>
            <Translation {...getTitleForNetwork(account.symbol)} />
            <div># {account.index + 1}</div>
        </>
    );

    return (
        <Wrapper selected={selected} type={account.accountType} ref={ref}>
            <AccountHeader
                onClick={() =>
                    props.goto('wallet-index', {
                        symbol: account.symbol,
                        accountIndex: account.index,
                        accountType: account.accountType,
                    })
                }
            >
                <AccountName>{accountLabel}</AccountName>
                <Row>
                    <CoinLogo size={16} symbol={account.symbol} />
                    <Balance>
                        <CoinBalance value={account.formattedBalance} symbol={account.symbol} />
                    </Balance>
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
                </Row>
            </AccountHeader>
            <AnimationWrapper opened={selected}>
                <AccountNavigation
                    account={account}
                    routeName={props.router.route?.name}
                    onClick={route => props.goto(route, undefined, true)}
                />
            </AnimationWrapper>
        </Wrapper>
    );
});

export default AccountItem;
