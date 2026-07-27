import { selectCoinDefinitions } from '@suite-common/token-definitions';
import { selectAccountIsStakingActive } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';
import { type AccountItemType } from 'src/types/wallet';
import { getTokens } from 'src/utils/wallet/tokenUtils';

import { AccountItem } from './AccountItem/AccountItem';
import { AccountItemsGroup } from './AccountItemsGroup';

interface AccountSectionProps {
    account: Account;
    forceOnlyItemClick?: boolean;
    hideStaking?: boolean;
    selected: boolean;
    onItemClick?: (account: Account, type: AccountItemType) => void;
}

export const AccountSection = ({
    account,
    forceOnlyItemClick,
    hideStaking,
    selected,
    onItemClick,
}: AccountSectionProps) => {
    const {
        symbol,
        accountType,
        index,
        descriptor,
        formattedBalance,
        tokens: accountTokens = [],
    } = account;

    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, symbol));

    const showGroup = hasNetworkFeatures(account, 'tokens');

    const isStakeShownStored = useSelector(state =>
        selectAccountIsStakingActive(state, account.key),
    );
    const isStakeShown = !hideStaking && isStakeShownStored;

    const tokens = getTokens({
        tokens: accountTokens,
        symbol: account.symbol,
        tokenDefinitions: coinDefinitions,
    });

    const dataTestKey = `@account-menu/${symbol}/${accountType}/${index}`;

    return showGroup && (isStakeShown || tokens.shownWithBalance.length) ? (
        <AccountItemsGroup
            key={`${descriptor}-${symbol}`}
            forceOnlyItemClick={forceOnlyItemClick}
            account={account}
            selected={selected}
            showStaking={isStakeShown}
            tokens={tokens.shownWithBalance}
            dataTestKey={dataTestKey}
            onItemClick={onItemClick}
        />
    ) : (
        <AccountItem
            type="coin"
            key={`${descriptor}-${symbol}`}
            forceOnlyItemClick={forceOnlyItemClick}
            account={account}
            isSelected={selected}
            onClick={onItemClick}
            formattedBalance={formattedBalance}
            tokens={tokens.shownWithBalance}
            dataTestKey={dataTestKey}
        />
    );
};
