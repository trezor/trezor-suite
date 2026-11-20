import { useSelector } from 'react-redux';

import { type AccountsRootState, selectFormattedAccountType } from '@suite-common/wallet-core';
import { AccountLabel } from '@suite-native/accounts';
import { Badge } from '@suite-native/atoms';
import { AddressFormatter } from '@suite-native/formatters';
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

    const info = account.addresses ? (
        formattedAccountType && <Badge label={formattedAccountType} size="small" />
    ) : (
        <AddressFormatter
            value={account.descriptor}
            format="long"
            variant="body-sm"
            color="contentSecondary"
            numberOfLines={1}
        />
    );

    return (
        <AccountListBaseItem
            receiveAccount={receiveAccount}
            label={<AccountLabel account={account} numberOfLines={1} />}
            isAddressDetail={false}
            info={info}
            onPress={onPress}
        />
    );
};
