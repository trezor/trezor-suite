import { isStakeInsideAccountBalance } from '@suite-common/earn-staking';
import { type Account } from '@suite-common/wallet-types';

import { AdaAccountsListStakingItem } from './AdaAccountsListStakingItem';
import { DefaultAccountsListStakingItem } from './DefaultAccountsListStakingItem';

type AccountsListStakingItemProps = {
    account: Account;
    stakingCryptoBalance: string;
    onPress: () => void;

    hasBackground?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    badges?: React.ReactNode;
};

export const AccountsListStakingItem = (props: AccountsListStakingItemProps) => {
    const { account } = props;

    // A stake inside the balance repeats no amount: the coin's row already holds it.
    if (isStakeInsideAccountBalance(account.symbol)) {
        return <AdaAccountsListStakingItem {...props} />;
    }

    return <DefaultAccountsListStakingItem {...props} />;
};
