import { useSelector } from 'react-redux';

import { type AccountKey } from '@suite-common/wallet-types';
import { Badge } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { type NativeAccountsRootState, selectActiveAndDefiTokensCount } from '../../selectors';

type AccountListTokenBadgeProps = {
    accountKey: AccountKey;
};

export const AccountListTokenBadge = ({ accountKey }: AccountListTokenBadgeProps) => {
    const numberOfTokens = useSelector((state: NativeAccountsRootState) =>
        selectActiveAndDefiTokensCount(state, accountKey),
    );

    return (
        <Badge
            size="small"
            label={<Translation id="accountList.numberOfTokens" values={{ numberOfTokens }} />}
        />
    );
};
