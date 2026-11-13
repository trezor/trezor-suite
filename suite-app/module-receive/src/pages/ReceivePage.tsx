import { selectFullSelectedAccount } from '@suite/account';
import { useDevice } from '@suite/device';
import { ReceiveContent } from '@suite/receive';
import { selectSelectedDevice } from '@suite-common/device';
import { Column } from '@trezor/components';
import {
    ConfirmEvmExplanationModal,
    FormattedCryptoAmount,
    WalletLayout,
    useSelector,
} from '@trezor/suite';

export const ReceivePage = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const device = useSelector(selectSelectedDevice);

    const { account } = selectedAccount;
    const { isLocked } = useDevice();

    if (account === undefined) {
        return null;
    }

    if (!device || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_RECEIVE" account={selectedAccount} />;
    }

    return (
        <WalletLayout title="TR_NAV_RECEIVE" isSubpage account={selectedAccount}>
            <Column gap={24} alignItems="stretch">
                <ReceiveContent
                    account={account}
                    locked={isLocked(true)}
                    AmountComponent={FormattedCryptoAmount}
                />
            </Column>

            <ConfirmEvmExplanationModal account={account} route="wallet-receive" />
        </WalletLayout>
    );
};
