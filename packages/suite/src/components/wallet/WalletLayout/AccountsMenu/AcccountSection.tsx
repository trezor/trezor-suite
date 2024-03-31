import { Account } from '@suite-common/wallet-types';
import { AccountItemsGroup } from './AccountItemsGroup';
import { AccountItem } from './AccountItem';
import { useSelector } from 'src/hooks/suite';
import { selectAccountStakeTransactions, selectCoinDefinitions } from '@suite-common/wallet-core';
import { getNetworkFeatures } from '@suite-common/wallet-config';
import { isTokenDefinitionKnown } from '@suite-common/token-definitions';
import { isSupportedNetworkSymbol } from '@suite-common/wallet-core/src/stake/stakeTypes';

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
    const stakeTxs = useSelector(state =>
        selectAccountStakeTransactions(state, account?.key || ''),
    );
    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, account.symbol));
    const hasStaked = stakeTxs.length > 0;
    const isStakeShown = isSupportedNetworkSymbol(account.symbol) && hasStaked;

    const showGroup = ['ethereum', 'solana', 'cardano'].includes(account.networkType);

    const hasCoinDefinitions = getNetworkFeatures(account.symbol).includes('coin-definitions');
    const tokens = account.tokens?.reduce<{
        knownTokens: Account['tokens'];
    }>(
        (acc, token) => {
            if (
                !hasCoinDefinitions ||
                isTokenDefinitionKnown(coinDefinitions?.data, account.symbol, token.contract)
            ) {
                acc.knownTokens?.push(token);
            }

            return acc;
        },
        { knownTokens: [] },
    );

    return showGroup && (isStakeShown || !!tokens?.knownTokens?.length) ? (
        <AccountItemsGroup
            key={`${account.descriptor}-${account.symbol}`}
            account={account}
            accountLabel={accountLabel}
            selected={selected}
            showStaking={isStakeShown}
            tokens={tokens?.knownTokens}
        />
    ) : (
        <AccountItem
            type="coin"
            key={`${account.descriptor}-${account.symbol}`}
            account={account}
            isSelected={selected}
            onClick={onItemClick}
            accountLabel={accountLabel}
            formattedBalance={account.formattedBalance}
            tokens={tokens?.knownTokens}
        />
    );
};
