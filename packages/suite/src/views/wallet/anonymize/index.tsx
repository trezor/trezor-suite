import { useSelector } from 'src/hooks/suite';
import { WalletLayoutHeader } from 'src/components/wallet';
import { CoinjoinConfirmation } from 'src/views/wallet/anonymize/components/CoinjoinConfirmation';
import { WalletLayout } from 'src/components/wallet/WalletLayout';

const Anonymize = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    return (
        <WalletLayout title="TR_NAV_ANONYMIZE" account={selectedAccount}>
            {selectedAccount.status === 'loaded' && (
                <>
                    <WalletLayoutHeader title="TR_NAV_ANONYMIZE" />
                    <CoinjoinConfirmation account={selectedAccount.account} />
                </>
            )}
        </WalletLayout>
    );
};

export default Anonymize;
