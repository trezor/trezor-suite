import { useSelector } from 'react-redux';

import { AccountsRootState, selectFormattedAccountType } from '@suite-common/wallet-core';
import { Badge } from '@suite-native/atoms';
import { CombinedLabelingState, selectAccountLabel } from '@suite-native/labeling';
import { ReceiveAccount } from '@suite-native/trading-types';

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

    const typeBadge = formattedAccountType && (
        <Badge label={formattedAccountType} size="small" elevation="1" />
    );

    const accountLabel =
        useSelector((state: CombinedLabelingState) =>
            selectAccountLabel(
                state,
                account.deviceState,
                account.descriptor,
                account.symbol,
                account.key,
            ),
        ) ?? '';

    return (
        <AccountListBaseItem
            receiveAccount={receiveAccount}
            label={accountLabel}
            isAddressDetail={false}
            info={typeBadge}
            onPress={onPress}
        />
    );
};
