import styled from 'styled-components';

import { selectIsDiscreteModeActive } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { BaseCurrencyAmount } from '@suite-common/wallet-utils';
import { Column, Row } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';

import { AccountLabel, CoinBalance } from 'src/components/suite';
import { AccountTypeBadge } from 'src/components/suite/AccountTypeBadge';
import { Translation } from 'src/components/suite/Translation';
import { useIsSidebarCollapsed } from 'src/components/suite/layouts/SuiteLayout/Sidebar/utils';
import { useSelector } from 'src/hooks/suite';
import { AccountItemType } from 'src/types/wallet';

import { BalancePlaceholder } from './BalancePlaceholder';
import { BaseCurrency } from './BaseCurrency';

export const AccountLabelContainer = styled.div`
    flex: 1;
    min-width: 60px;
    color: ${({ theme }) => theme.textDefault};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: flex;
    gap: ${spacingsPx.xxs};
`;

type AccountItemContentProps = {
    customFiatValue?: BaseCurrencyAmount;
    account: Account;
    type: AccountItemType;
    formattedBalance: string;
    dataTestKey?: string;
    isFiatLoading?: boolean;
};

export const AccountItemContent = ({
    customFiatValue,
    account,
    type,
    formattedBalance,
    dataTestKey,
    isFiatLoading,
}: AccountItemContentProps) => {
    const discreetMode = useSelector(selectIsDiscreteModeActive);
    const isSidebarCollapsed = useIsSidebarCollapsed();
    const isBalanceShown = account.backendType !== 'coinjoin' || account.status !== 'initial';

    if (isSidebarCollapsed) {
        return (
            <Column flex="1" overflow={discreetMode ? 'visible' : 'hidden'} gap={spacings.xxxs}>
                <Row
                    gap={spacings.md}
                    margin={{ right: spacings.xxs }}
                    justifyContent="space-between"
                >
                    <AccountLabelContainer data-testid={`${dataTestKey}/label`}>
                        <AccountLabel account={account} />
                        <AccountTypeBadge
                            accountType={account.accountType}
                            networkType={account.networkType}
                        />
                    </AccountLabelContainer>

                    <BaseCurrency
                        isLoading={isFiatLoading}
                        customFiatValue={customFiatValue}
                        symbol={account.symbol}
                        formattedBalance={formattedBalance}
                    />
                </Row>

                <Column gap={spacings.xs}>
                    <AccountLabelContainer data-testid={`${dataTestKey}/label`}>
                        {type === 'staking' && <Translation id="TR_NAV_STAKING" />}
                        {type === 'tokens' && <Translation id="TR_NAV_TOKENS" />}
                    </AccountLabelContainer>

                    {isBalanceShown && type !== 'tokens' && (
                        <CoinBalance
                            data-testid="@wallet"
                            value={formattedBalance}
                            symbol={account.symbol}
                        />
                    )}
                </Column>

                {!isBalanceShown && <BalancePlaceholder networkSymbol={account.symbol} />}
            </Column>
        );
    }

    return (
        // Content is constant size in discreet mode, so overflow: hidden is unnecessary.
        // Though it would cut off CSS blur effect, so we may turn it off
        <Column flex="1" overflow={discreetMode ? 'visible' : 'hidden'} gap={spacings.xxxs}>
            <Row gap={spacings.md} margin={{ right: spacings.xxs }} justifyContent="space-between">
                <AccountLabelContainer data-testid={`${dataTestKey}/label`}>
                    {type === 'coin' && <AccountLabel account={account} />}
                    {type === 'staking' && <Translation id="TR_NAV_STAKING" />}
                    {type === 'tokens' && <Translation id="TR_NAV_TOKENS" />}
                </AccountLabelContainer>

                <BaseCurrency
                    isLoading={isFiatLoading}
                    customFiatValue={customFiatValue}
                    symbol={account.symbol}
                    formattedBalance={formattedBalance}
                />
            </Row>
            {isBalanceShown && type !== 'tokens' && (
                <CoinBalance
                    data-testid="@wallet"
                    value={formattedBalance}
                    symbol={account.symbol}
                />
            )}
            {!isBalanceShown && <BalancePlaceholder networkSymbol={account.symbol} />}
        </Column>
    );
};
