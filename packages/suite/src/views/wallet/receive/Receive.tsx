import { selectDevice, selectPendingAccountAddresses } from '@suite-common/wallet-core';

import { WalletLayout, WalletSubpageHeading } from 'src/components/wallet';
import { useDevice, useSelector } from 'src/hooks/suite';

import { FreshAddress } from './components/FreshAddress';
import { UsedAddresses } from './components/UsedAddresses';
import { CoinjoinReceiveWarning } from './components/CoinjoinReceiveWarning';
import { ConfirmEvmExplanationModal } from 'src/components/suite/modals';
import { ConnectDevicePromo } from './components/ConnectDevicePromo';
import { Flex } from '@trezor/components';
import { spacings } from '@trezor/theme';

export const Receive = () => {
    const isCoinjoinReceiveWarningHidden = useSelector(
        state => state.suite.settings.isCoinjoinReceiveWarningHidden,
    );
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const receive = useSelector(state => state.wallet.receive);
    const device = useSelector(selectDevice);

    const { account } = selectedAccount;

    const pendingAddresses = useSelector(state =>
        selectPendingAccountAddresses(state, account?.key ?? null),
    );

    const { isLocked } = useDevice();

    const isDeviceLocked = isLocked(true);

    if (!device || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_RECEIVE" account={selectedAccount} />;
    }

    const disabled = !!device.authConfirm;
    const showCexWarning = account?.accountType === 'coinjoin' && !isCoinjoinReceiveWarningHidden;

    console.log('isDeviceLocked', isDeviceLocked);

    return (
        <WalletLayout title="TR_NAV_RECEIVE" isSubpage account={selectedAccount}>
            <Flex gap={spacings.sm} direction="column" alignItems="start">
                {true && <ConnectDevicePromo />}

                <WalletSubpageHeading title="TR_NAV_RECEIVE" />

                {showCexWarning && <CoinjoinReceiveWarning />}

                <FreshAddress
                    account={account}
                    addresses={receive}
                    disabled={disabled}
                    locked={isDeviceLocked}
                    pendingAddresses={pendingAddresses}
                />

                <UsedAddresses
                    account={account}
                    addresses={receive}
                    locked={isDeviceLocked}
                    pendingAddresses={pendingAddresses}
                />

                <ConfirmEvmExplanationModal account={account} route="wallet-receive" />
            </Flex>
        </WalletLayout>
    );
};
