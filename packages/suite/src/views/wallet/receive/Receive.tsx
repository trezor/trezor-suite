import { selectFullSelectedAccount } from '@suite/account';
import { useDevice } from '@suite/device';
import { ReceiveContent } from '@suite/receive';
import { selectIsCoinjoinReceiveWarningHidden } from '@suite/settings';
import { selectSelectedDevice } from '@suite-common/device';
import { Column } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite';
import { ConfirmEvmExplanationModal } from 'src/components/suite/modals/ConfirmEvmExplanationModal';
import { WalletLayout } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';

import { CoinjoinReceiveWarning } from './components/CoinjoinReceiveWarning';

export const Receive = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const device = useSelector(selectSelectedDevice);
    const isCoinjoinReceiveWarningHidden = useSelector(selectIsCoinjoinReceiveWarningHidden);

    const { account } = selectedAccount;
    const { isLocked } = useDevice();

    if (account === undefined) {
        return null;
    }

    if (!device || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_RECEIVE" account={selectedAccount} />;
    }

    const showCexWarning = account.accountType === 'coinjoin' && !isCoinjoinReceiveWarningHidden;

    return (
        <WalletLayout title="TR_NAV_RECEIVE" isSubpage account={selectedAccount}>
            <Column gap={24} alignItems="stretch">
                {showCexWarning && <CoinjoinReceiveWarning />}
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
