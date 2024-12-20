import { Account } from '@suite-common/wallet-types';
import { selectCoinDefinitions } from '@suite-common/token-definitions';
import { selectEthAccountHasStaked, selectSolAccountHasStaked } from '@suite-common/wallet-core';
import { isSupportedStakingNetworkSymbol } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';
import { getTokens } from 'src/utils/wallet/tokenUtils';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

import { AccountItem } from './AccountItem/AccountItem';
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

    const isDebugModeActive = useSelector(selectIsDebugModeActive);

    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, symbol));
    const hasEthStaked = useSelector(state => selectEthAccountHasStaked(state, account.key));
    const hasSolStaked = useSelector(state => selectSolAccountHasStaked(state, account.key));

    // TODO: remove isDebugModeActive when staking will be ready for launch
    const isSolStakingEnabled = hasSolStaked && isDebugModeActive;

    const isStakeShown =
        isSupportedStakingNetworkSymbol(symbol) && (hasEthStaked || isSolStakingEnabled);

    const showGroup = ['ethereum', 'solana', 'cardano'].includes(networkType);

    const tokens = getTokens({
        tokens: accountTokens,
        symbol: account.symbol,
        tokenDefinitions: coinDefinitions,
    });

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
