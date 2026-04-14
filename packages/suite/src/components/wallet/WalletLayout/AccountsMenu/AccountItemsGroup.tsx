import styled from 'styled-components';

import { selectRouteName } from '@suite/router';
import { selectBaseCurrency, selectCurrentFiatRates } from '@suite-common/wallet-core';
import {
    BASE_CURRENCY_ZERO,
    areTokenFiatRatesLoading,
    getAccountTokensFiatBalance,
    getAccountTotalStakingBalance,
} from '@suite-common/wallet-utils';
import { Column } from '@trezor/components';
import { borders, spacings, spacingsPx } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';
import { type Account } from 'src/types/wallet';

import { AccountItem, type AccountItemProps } from './AccountItem/AccountItem';

const Section = styled.div<{ $selected?: boolean; $isSidebarCollapsed?: boolean }>`
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: ${borders.radii.sm};

    outline: 1px solid
        ${({ theme, $selected }) => ($selected ? theme.borderNeutral : 'transparent')};
    padding: ${spacingsPx.xxs};
    margin: 0 -${spacingsPx.xxs};

    &::before {
        content: '';
        position: absolute;
        top: 24px;
        bottom: 28px;
        left: ${({ $isSidebarCollapsed }) => ($isSidebarCollapsed ? '50%' : '24px')};
        border-left: 2px dotted ${({ theme }) => theme.borderNeutral};
    }
`;

interface AccountItemsGroupProps {
    account: Account;
    forceOnlyItemClick?: boolean;
    selected: boolean;
    showStaking: boolean;
    tokens?: Account['tokens'];
    dataTestKey?: string;
    onItemClick?: AccountItemProps['onClick'];
}

export const AccountItemsGroup = ({
    account,
    forceOnlyItemClick,
    selected,
    showStaking,
    tokens,
    dataTestKey,
    onItemClick,
}: AccountItemsGroupProps) => {
    const { isSidebarCollapsed } = useResponsiveContext();
    const stakingBalance = getAccountTotalStakingBalance(account);

    const routeName = useSelector(selectRouteName);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const rates = useSelector(selectCurrentFiatRates);

    const isFiatLoading = areTokenFiatRatesLoading(account, baseCurrencyCode, rates ?? {});
    const tokensFiatBalance = isFiatLoading
        ? BASE_CURRENCY_ZERO
        : getAccountTokensFiatBalance(account, baseCurrencyCode, rates, tokens);

    const tokensRoutes = ['wallet-tokens', 'wallet-tokens-hidden', 'wallet-tokens-inactive'];

    return (
        <Section $selected={selected} $isSidebarCollapsed={isSidebarCollapsed}>
            <Column gap={spacings.xxs}>
                <AccountItem
                    type="coin"
                    account={account}
                    forceOnlyItemClick={forceOnlyItemClick}
                    isSelected={
                        selected &&
                        (routeName === 'wallet-index' ||
                            (routeName === 'wallet-staking' && !showStaking))
                    }
                    formattedBalance={account.formattedBalance}
                    dataTestKey={dataTestKey}
                    onClick={onItemClick}
                />
                {showStaking && (
                    <AccountItem
                        account={account}
                        forceOnlyItemClick={forceOnlyItemClick}
                        type="staking"
                        isSelected={selected && routeName === 'wallet-staking'}
                        formattedBalance={stakingBalance ?? '0'}
                        dataTestKey={`${dataTestKey}/staking`}
                        onClick={onItemClick}
                    />
                )}
                {!!tokens?.length && (
                    <AccountItem
                        account={account}
                        forceOnlyItemClick={forceOnlyItemClick}
                        type="tokens"
                        isSelected={selected && tokensRoutes.includes(routeName || '')}
                        formattedBalance={account.formattedBalance}
                        customFiatValue={tokensFiatBalance}
                        tokens={tokens}
                        dataTestKey={`${dataTestKey}/tokens`}
                        isFiatLoading={isFiatLoading}
                        onClick={onItemClick}
                    />
                )}
            </Column>
        </Section>
    );
};
