import { selectFullSelectedAccount } from '@suite/account';
import { Column } from '@trezor/components';

import { WalletLayout, WalletSubpageHeading } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';
import { CoinjoinConfirmation } from 'src/views/wallet/anonymize/components/CoinjoinConfirmation';

const Anonymize = () => {
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

export default Anonymize;
