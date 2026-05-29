import { AccountLabel } from '@suite/account';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';

interface AssetPickerAccountLabelProps {
    accountKey?: AccountKey;
}

export function AssetPickerAccountLabel({ accountKey }: AssetPickerAccountLabelProps) {
    const account = useSelector(state => selectAccountByKey(state, accountKey));

    if (!account) {
        return null;
    }

    return (
        <AccountLabel
            account={account}
            showAccountTypeBadge={true}
            intent="neutral"
            priority="secondary"
            typographyStyle="body-xs"
        />
    );
}
