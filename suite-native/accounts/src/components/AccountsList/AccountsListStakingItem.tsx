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
};

export const AccountsListStakingItem = (props: AccountsListStakingItemProps) => {
    const { account } = props;

    if (account.symbol === 'ada') {
        return <AdaAccountsListStakingItem {...props} />;
    }

    return <DefaultAccountsListStakingItem {...props} />;
};
