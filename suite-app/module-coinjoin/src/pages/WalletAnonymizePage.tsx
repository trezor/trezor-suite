import { selectFullSelectedAccount } from '@suite/account';
import { Column } from '@trezor/components';
import {
    CoinjoinConfirmation,
    WalletLayout,
    WalletSubpageHeading,
    useSelector,
} from '@trezor/suite';

export const WalletAnonymizePage = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);

    return (
        <WalletLayout title="TR_NAV_ANONYMIZE" isSubpage account={selectedAccount}>
            {selectedAccount.status === 'loaded' && (
                <Column gap={24}>
                    <WalletSubpageHeading title="TR_NAV_ANONYMIZE" />
                    <CoinjoinConfirmation account={selectedAccount.account} />
                </Column>
            )}
        </WalletLayout>
    );
};
