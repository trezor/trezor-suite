import styled from 'styled-components';
import { AccountItem } from './AccountItem';
import { Account } from 'src/types/wallet';
import { borders, spacingsPx, spacings } from '@trezor/theme';
import { useSelector } from 'src/hooks/suite';
import { selectCurrentFiatRates } from '@suite-common/wallet-core';
import {
    getAccountTotalStakingBalance,
    getAccountTokensFiatBalance,
} from '@suite-common/wallet-utils';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { selectRouteName } from 'src/reducers/suite/routerReducer';
import { Column } from '@trezor/components';

const Section = styled.div<{ $selected?: boolean }>`
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
        bottom: 24px;
        left: 24px;
        border-left: 2px dotted ${({ theme }) => theme.borderDashed};
    }
`;

interface AccountItemsGroupProps {
    account: Account;
    accountLabel?: string;
    selected: boolean;
    showStaking: boolean;
    tokens?: Account['tokens'];
    dataTestKey?: string;
}

export const AccountItemsGroup = ({
    account,
    accountLabel,
    selected,
    showStaking,
    tokens,
    dataTestKey,
}: AccountItemsGroupProps) => {
    const stakingBalance = getAccountTotalStakingBalance(account);

    const routeName = useSelector(selectRouteName);
    const localCurrency = useSelector(selectLocalCurrency);
    const rates = useSelector(selectCurrentFiatRates);

    const tokensFiatBalance = getAccountTokensFiatBalance(account, localCurrency, rates, tokens);

    const tokensRoutes = ['wallet-tokens-coins', 'wallet-tokens-hidden'];

    return (
        <Section $selected={selected}>
            <Column alignItems="stretch" gap={spacings.xxs}>
                <AccountItem
                    type="coin"
                    account={account}
                    isSelected={
                        selected &&
                        (routeName === 'wallet-index' ||
                            (routeName === 'wallet-staking' && !showStaking))
                    }
                    accountLabel={accountLabel}
                    formattedBalance={account.formattedBalance}
                    isGroup
                    isGroupSelected={selected}
                    dataTestKey={dataTestKey}
                />
                {showStaking && (
                    <AccountItem
                        account={account}
                        type="staking"
                        isSelected={selected && routeName === 'wallet-staking'}
                        formattedBalance={stakingBalance}
                        isGroup
                        isGroupSelected={selected}
                        dataTestKey={`${dataTestKey}/staking`}
                    />
                )}
                {!!tokens?.length && (
                    <AccountItem
                        account={account}
                        type="tokens"
                        isSelected={selected && tokensRoutes.includes(routeName || '')}
                        formattedBalance={account.formattedBalance}
                        isGroup
                        isGroupSelected={selected}
                        customFiatValue={tokensFiatBalance}
                        tokens={tokens}
                        dataTestKey={`${dataTestKey}/tokens`}
                    />
                )}
            </Column>
        </Section>
    );
};
