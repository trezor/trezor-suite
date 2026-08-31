import { useSelector } from '@suite-common/redux-utils';
import { selectAccountIsStakingActive } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { Row } from '@trezor/components';

import { AccountItem } from './AccountItem/AccountItem';
import { AccountItemsGroup } from './AccountItemsGroup';

interface AccountSectionProps {
    account: Account;
    tokens: TokenInfo[];
    selected: boolean;
}

export const AccountSection = ({ account, tokens, selected }: AccountSectionProps) => {
    const { symbol, accountType, index, descriptor, formattedBalance } = account;

    const showGroup = hasNetworkFeatures(account, 'tokens');

    const isStakeShown = useSelector(state => selectAccountIsStakingActive(state, account.key));
    const dataTestKey = `@account-menu/${symbol}/${accountType}/${index}`;

    return showGroup && (isStakeShown || tokens.length) ? (
        <AccountItemsGroup
            key={`${descriptor}-${symbol}`}
            account={account}
            selected={selected}
            showStaking={isStakeShown}
            tokens={tokens}
            dataTestKey={dataTestKey}
        />
    ) : (
        <Row>
            <AccountItem
                type="coin"
                key={`${descriptor}-${symbol}`}
                account={account}
                isSelected={selected}
                formattedBalance={formattedBalance}
                tokens={tokens}
                dataTestKey={dataTestKey}
            />
        </Row>
    );
};
