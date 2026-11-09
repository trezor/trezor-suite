import { useSelector } from 'react-redux';

import { type AccountKey } from '@suite-common/wallet-types';
import { Badge } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { type NativeAccountsRootState, selectAccountVisibleTokensCount } from '../../selectors';

type AccountListTokenBadgeProps = {
    accountKey: AccountKey;
};

export const AccountListTokenBadge = ({ accountKey }: AccountListTokenBadgeProps) => {
    const { translate } = useTranslate();
    const numberOfTokens = useSelector((state: NativeAccountsRootState) =>
        selectAccountVisibleTokensCount(state, accountKey),
    );

    return (
        <Badge
            size="small"
            icon="coins"
            accessible
            accessibilityLabel={translate('accountList.numberOfTokens', { numberOfTokens })}
            label={`+${numberOfTokens}`}
        />
    );
};
