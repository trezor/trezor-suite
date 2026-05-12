import { useSelector } from 'react-redux';

import { type AccountsRootState, selectFormattedAccountType } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Badge, type BadgeProps } from '@suite-native/atoms';

type AccountTypeBadgeProps = {
    accountKey: AccountKey;
} & Pick<BadgeProps, 'alignSelf'>;

export const AccountTypeBadge = ({ accountKey, alignSelf }: AccountTypeBadgeProps) => {
    const formattedAccountType = useSelector((state: AccountsRootState) =>
        selectFormattedAccountType(state, accountKey),
    );

    if (!formattedAccountType) {
        return null;
    }

    return <Badge label={formattedAccountType} size="small" alignSelf={alignSelf} />;
};
