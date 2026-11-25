import { selectFullSelectedAccount } from '@suite/account';
import { AccountAssetOverview, useSelector } from '@trezor/suite';

/** The asset-first overview of the selected account, once it is loaded. */
export const SelectedAccountAssetOverview = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);

    return selectedAccount.status === 'loaded' ? (
        <AccountAssetOverview accountKey={selectedAccount.account.key} />
    ) : null;
};
