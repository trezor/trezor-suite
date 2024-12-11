import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { WalletLayout, WalletSubpageHeading } from 'src/components/wallet';
import { CoinjoinConfirmation } from 'src/views/wallet/anonymize/components/CoinjoinConfirmation';

const Anonymize = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    return (
        <WalletLayout title="TR_NAV_ANONYMIZE" isSubpage account={selectedAccount}>
            {selectedAccount.status === 'loaded' && (
                <Column gap={spacings.xl}>
                    <WalletSubpageHeading title="TR_NAV_ANONYMIZE" />
                    <CoinjoinConfirmation account={selectedAccount.account} />
                </Column>
            )}
        </WalletLayout>
    );
};

export default Anonymize;
