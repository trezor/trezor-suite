import { useSelector } from 'react-redux';

import { AccountsRootState, selectFormattedAccountType } from '@suite-common/wallet-core';
import { Badge } from '@suite-native/atoms';

import { AccountListBaseItem } from './AccountListBaseItem';
import { ReceiveAccount } from '../../../types/general';

export type AccountListItemProps = {
    receiveAccount: ReceiveAccount;
    onPress: () => void;
};

export const AccountListItem = ({ receiveAccount, onPress }: AccountListItemProps) => {
    const { account } = receiveAccount;
    const formattedAccountType = useSelector((state: AccountsRootState) =>
        selectFormattedAccountType(state, account.key),
    );

    const typeBadge = formattedAccountType && (
        <Badge label={formattedAccountType} size="small" elevation="1" />
    );

    return (
        <AccountListBaseItem
            receiveAccount={receiveAccount}
            label={account.accountLabel}
            isAddressDetail={false}
            info={typeBadge}
            onPress={onPress}
        />
    );
};
