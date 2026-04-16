import { useSelector } from 'react-redux';

import { type AccountsRootState, selectFormattedAccountType } from '@suite-common/wallet-core';
import { Badge } from '@suite-native/atoms';
import { AccountLabel } from '@suite-native/labeling';
import { type ReceiveAccount } from '@suite-native/trading-types';

import { AccountListBaseItem } from './AccountListBaseItem';

export type AccountListItemProps = {
    receiveAccount: ReceiveAccount;
    onPress: () => void;
};

export const AccountListItem = ({ receiveAccount, onPress }: AccountListItemProps) => {
    const { account } = receiveAccount;
    const formattedAccountType = useSelector((state: AccountsRootState) =>
        selectFormattedAccountType(state, account.key),
    );

    const typeBadge = formattedAccountType && <Badge label={formattedAccountType} size="small" />;

    return (
        <AccountListBaseItem
            receiveAccount={receiveAccount}
            label={<AccountLabel account={account} />}
            isAddressDetail={false}
            info={typeBadge}
            onPress={onPress}
        />
    );
};
