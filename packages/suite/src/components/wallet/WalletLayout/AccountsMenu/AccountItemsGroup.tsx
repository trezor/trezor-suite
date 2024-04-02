import styled from 'styled-components';
import { AccountItem } from './AccountItem';
import { Account } from 'src/types/wallet';
import { borders, spacingsPx } from '@trezor/theme';
import { useSelector } from 'src/hooks/suite';
import { selectFiatRates } from '@suite-common/wallet-core';
import { getTokensFiatBalance } from '@suite-common/wallet-utils';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { getAccountAutocompoundBalance } from 'src/utils/wallet/stakingUtils';
import { selectRouteName } from 'src/reducers/suite/routerReducer';

const Section = styled.div<{ $selected?: boolean }>`
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: ${borders.radii.md};
    margin: 5px 0;
    gap: ${spacingsPx.xxs};

    ${({ $selected, theme }) =>
        $selected &&
        `border: 1px solid ${theme.borderElevation0};
         padding: ${spacingsPx.xxs} 0;
         margin: 5px ${spacingsPx.xxs};
    `}
`;

const Wrapper = styled.div`
    position: relative;
`;

const Divider = styled.div<{ $selected?: boolean; $isBigger?: boolean }>`
    position: absolute;
    left: ${({ $selected }) => ($selected ? '24px' : '29px')};
    margin-top: 25px;
    bottom: 20px;
    border-left: 2px dashed ${({ theme }) => theme.borderDashed};
    height: ${({ $isBigger }) => ($isBigger ? '80px' : '50px')};
    width: 1px;
    z-index: 10;
`;

interface AccountItemsGroupProps {
    account: Account;
    accountLabel?: string;
    selected: boolean;
    showStaking: boolean;
    tokens?: Account['tokens'];
}

export const AccountItemsGroup = ({
    account,
    accountLabel,
    selected,
    showStaking,
    tokens,
}: AccountItemsGroupProps) => {
    const autocompoundBalance = getAccountAutocompoundBalance(account);

    const routeName = useSelector(selectRouteName);
    const localCurrency = useSelector(selectLocalCurrency);
    const rates = useSelector(selectFiatRates);

    const tokensFiatBalance = getTokensFiatBalance(account, localCurrency, rates, tokens);

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
            />
            {showStaking && (
                <Wrapper>
                    <Divider $selected={selected} $isBigger />
                    <AccountItem
                        account={account}
                        type="staking"
                        isSelected={selected && routeName === 'wallet-staking'}
                        formattedBalance={autocompoundBalance}
                        isGroup
                        isGroupSelected={selected}
                    />
                </Wrapper>
            )}
            {!!tokens?.length && (
                <Wrapper>
                    <Divider $selected={selected} />
                    <AccountItem
                        account={account}
                        type="tokens"
                        isSelected={selected && routeName === 'wallet-tokens'}
                        formattedBalance={account.formattedBalance}
                        isGroup
                        isGroupSelected={selected}
                        customFiatValue={tokensFiatBalance}
                        tokens={tokens}
                    />
                </Wrapper>
            )}
        </Section>
    );
};
