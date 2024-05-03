import { Account } from '@suite-common/wallet-types';
import { AccountItemsGroup } from './AccountItemsGroup';
import { AccountItem } from './AccountItem';
import { useSelector } from 'src/hooks/suite';
import { getNetworkFeatures } from '@suite-common/wallet-config';
import { isTokenDefinitionKnown, selectCoinDefinitions } from '@suite-common/token-definitions';
import { isSupportedNetworkSymbol } from '@suite-common/wallet-core';

interface AccountSectionProps {
    account: Account;
    selected: boolean;
    accountLabel?: string;
    onItemClick?: () => void;
}

export const AccountSection = ({
    account,
    selected,
    accountLabel,
    onItemClick,
}: AccountSectionProps) => {
    const {
        symbol,
        accountType,
        index,
        networkType,
        descriptor,
        formattedBalance,
        tokens: accountTokens = [],
        misc,
    } = account;

    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, symbol));
    const hasStaked = networkType === 'ethereum' && !!misc?.stakingPools?.length;
    const isStakeShown = isSupportedNetworkSymbol(symbol) && hasStaked;

    const showGroup = ['ethereum', 'solana', 'cardano'].includes(networkType);

    const hasCoinDefinitions = getNetworkFeatures(symbol).includes('coin-definitions');
    const tokens = !hasCoinDefinitions
        ? accountTokens
        : accountTokens.filter(token =>
              isTokenDefinitionKnown(coinDefinitions?.data, symbol, token.contract),
          );

    const dataTestKey = `@account-menu/${symbol}/${accountType}/${index}`;

    return showGroup && (isStakeShown || tokens.length) ? (
        <AccountItemsGroup
            key={`${descriptor}-${symbol}`}
            account={account}
            accountLabel={accountLabel}
            selected={selected}
            showStaking={isStakeShown}
            tokens={tokens}
            dataTestKey={dataTestKey}
        />
    ) : (
        <AccountItem
            type="coin"
            key={`${descriptor}-${symbol}`}
            account={account}
            isSelected={selected}
            onClick={onItemClick}
            accountLabel={accountLabel}
            formattedBalance={formattedBalance}
            tokens={tokens}
            dataTestKey={dataTestKey}
        />
    );
};
