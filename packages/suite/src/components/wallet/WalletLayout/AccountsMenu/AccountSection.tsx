import { Account } from '@suite-common/wallet-types';
import { selectCoinDefinitions } from '@suite-common/token-definitions';
import { selectAccountHasStaked } from '@suite-common/wallet-core';
import { isSupportedEthStakingNetworkSymbol } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';
import { getTokens } from 'src/utils/wallet/tokenUtils';

import { AccountItem } from './AccountItem';
import { AccountItemsGroup } from './AccountItemsGroup';

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
    } = account;

    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, symbol));
    const hasStaked = useSelector(state => selectAccountHasStaked(state, account));

    const isStakeShown = isSupportedEthStakingNetworkSymbol(symbol) && hasStaked;

    const showGroup = ['ethereum', 'solana', 'cardano'].includes(networkType);

    const tokens = getTokens(accountTokens, account.symbol, coinDefinitions);

    const dataTestKey = `@account-menu/${symbol}/${accountType}/${index}`;

    return showGroup && (isStakeShown || tokens.shownWithBalance.length) ? (
        <AccountItemsGroup
            key={`${descriptor}-${symbol}`}
            account={account}
            accountLabel={accountLabel}
            selected={selected}
            showStaking={isStakeShown}
            tokens={tokens.shownWithBalance}
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
            tokens={tokens.shownWithBalance}
            dataTestKey={dataTestKey}
        />
    );
};
