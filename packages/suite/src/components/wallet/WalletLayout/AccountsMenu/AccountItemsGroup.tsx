import styled from 'styled-components';

import { EnhancedTokenInfo } from '@suite-common/token-definitions';
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
import { selectRouteName } from 'src/reducers/suite/routerReducer';
import { Account, AccountItemType } from 'src/types/wallet';

import { AccountItem } from './AccountItem/AccountItem';
import { TokensAccountItem } from './AccountItem/TokensAccountItem';
import { useIsSidebarCollapsed } from '../../../suite/layouts/SuiteLayout/Sidebar/utils';

const Section = styled.div<{ $selected?: boolean; $isSidebarCollapsed?: boolean }>`
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: ${borders.radii.md};

    outline: 1px solid
        ${({ theme, $selected }) => ($selected ? theme.borderElevation0 : 'transparent')};
    padding: ${spacingsPx.xxs};
    margin: 0 -${spacingsPx.xxs};

    &::before {
        content: '';
        position: absolute;
        top: 24px;
        bottom: 28px;
        left: ${({ $isSidebarCollapsed }) => ($isSidebarCollapsed ? '50%' : '24px')};
        border-left: 2px dotted ${({ theme }) => theme.borderDashed};
    }
`;

interface AccountItemsGroupProps {
    account: Account;
    forceOnlyItemClick?: boolean;
    selected: boolean;
    showStaking: boolean;
    tokens?: EnhancedTokenInfo[];
    dataTestKey?: string;
    onItemClick?: (account: Account, type: AccountItemType) => void;
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
    const isSidebarCollapsed = useIsSidebarCollapsed();
    const stakingBalance = getAccountTotalStakingBalance(account);

    const routeName = useSelector(selectRouteName);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const rates = useSelector(selectCurrentFiatRates);

    const isFiatLoading = areTokenFiatRatesLoading(account, baseCurrencyCode, rates ?? {});
    const tokensFiatBalance = isFiatLoading
        ? BASE_CURRENCY_ZERO
        : getAccountTokensFiatBalance(account, baseCurrencyCode, rates, tokens);

    const tokensRoutes = ['wallet-tokens', 'wallet-tokens-hidden'];

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
                    isGroup
                    isGroupSelected={selected}
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
                        isGroup
                        isGroupSelected={selected}
                        dataTestKey={`${dataTestKey}/staking`}
                        onClick={onItemClick}
                    />
                )}
                {!!tokens?.length && (
                    <TokensAccountItem
                        account={account}
                        tokens={tokens}
                        forceOnlyItemClick={forceOnlyItemClick}
                        isSelected={selected && tokensRoutes.includes(routeName || '')}
                        formattedBalance={account.formattedBalance}
                        isGroup
                        isGroupSelected={selected}
                        dataTestKey={`${dataTestKey}/tokens`}
                        isFiatLoading={isFiatLoading}
                        customFiatValue={tokensFiatBalance}
                        onClick={onItemClick}
                    />
                )}
            </Column>
        </Section>
    );
};
