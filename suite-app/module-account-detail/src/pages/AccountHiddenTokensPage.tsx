import { selectFullSelectedAccount } from '@suite/account';
import { HiddenTokensList, WalletLayout, useSelector } from '@trezor/suite';

export const AccountHiddenTokensPage = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);

    return (
        <WalletLayout title="TR_HIDDEN_TOKENS" account={selectedAccount} isSubpage>
            {selectedAccount.status === 'loaded' && (
                <HiddenTokensList accountKey={selectedAccount.account.key} />
            )}
        </WalletLayout>
    );
};
