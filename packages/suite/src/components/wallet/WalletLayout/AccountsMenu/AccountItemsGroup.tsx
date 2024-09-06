import styled from 'styled-components';
import { AccountItem } from './AccountItem';
import { Account } from 'src/types/wallet';
import { borders, spacingsPx } from '@trezor/theme';
import { useSelector } from 'src/hooks/suite';
import { selectCurrentFiatRates } from '@suite-common/wallet-core';
import { getAccountTotalStakingBalance, getTokensFiatBalance } from '@suite-common/wallet-utils';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { selectRouteName } from 'src/reducers/suite/routerReducer';

const Section = styled.div<{ $selected?: boolean }>`
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: ${borders.radii.md};
    gap: ${spacingsPx.xxs};

    border: 1px solid
        ${({ theme, $selected }) => ($selected ? theme.borderElevation0 : 'transparent')};
    padding: ${spacingsPx.xxs} 0;
    margin: 5px ${spacingsPx.xxs};
`;

const Wrapper = styled.div`
    position: relative;
`;

const Divider = styled.div<{ $isBigger?: boolean }>`
    position: absolute;
    left: 24px;
    bottom: 25px;
    border-left: 2px dashed ${({ theme }) => theme.borderDashed};
    height: ${({ $isBigger }) => ($isBigger ? '60px' : '50px')};
    width: 1px;
    z-index: 10;
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

    const tokensFiatBalance = getTokensFiatBalance(account, localCurrency, rates, tokens);

    const tokensRoutes = ['wallet-tokens-coins', 'wallet-tokens-hidden'];

    return (
        <Section $selected={selected}>
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
                <Wrapper>
                    <Divider $isBigger />
                    <AccountItem
                        account={account}
                        type="staking"
                        isSelected={selected && routeName === 'wallet-staking'}
                        formattedBalance={stakingBalance}
                        isGroup
                        isGroupSelected={selected}
                        dataTestKey={`${dataTestKey}/staking`}
                    />
                </Wrapper>
            )}
            {!!tokens?.length && (
                <Wrapper>
                    <Divider />
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
                </Wrapper>
            )}
        </Section>
    );
};
