import { selectPendingAccountAddresses, selectSelectedDevice } from '@suite-common/wallet-core';
import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { ConfirmEvmExplanationModal } from 'src/components/suite/modals';
import { WalletLayout, WalletSubpageHeading } from 'src/components/wallet';
import { useDevice, useSelector } from 'src/hooks/suite';
import { selectIsFirmwareAuthenticityCheckEnabledAndHardFailed } from 'src/reducers/suite/suiteReducer';

import { CoinjoinReceiveWarning } from './components/CoinjoinReceiveWarning';
import { ConnectDeviceReceivePromo } from './components/ConnectDevicePromo';
import { FreshAddress } from './components/FreshAddress';
import { UsedAddresses } from './components/UsedAddresses';

export const Receive = () => {
    const isCoinjoinReceiveWarningHidden = useSelector(
        state => state.suite.settings.isCoinjoinReceiveWarningHidden,
    );
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const receive = useSelector(state => state.wallet.receive);
    const device = useSelector(selectSelectedDevice);

    const isAuthenticityCheckFailed = useSelector(
        selectIsFirmwareAuthenticityCheckEnabledAndHardFailed,
    );

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

    const isDeviceConnected = device.connected && device.available;
    // FW check hard failure is persisted for view-only → severe banner is shown & Receive button disabled, so this weaker banner is superfluous
    const isConnectDevicePromoDisplayed = !isDeviceConnected && !isAuthenticityCheckFailed;

    return (
        <WalletLayout title="TR_NAV_RECEIVE" isSubpage account={selectedAccount}>
            {isConnectDevicePromoDisplayed && <ConnectDeviceReceivePromo />}
            {showCexWarning && <CoinjoinReceiveWarning />}
            <Column gap={spacings.xl}>
                <WalletSubpageHeading title="TR_NAV_RECEIVE" />
                <FreshAddress
                    account={account}
                    addresses={receive}
                    disabled={disabled}
                    locked={isDeviceLocked}
                    pendingAddresses={pendingAddresses}
                    isDeviceConnected={isDeviceConnected}
                />
                <UsedAddresses
                    account={account}
                    addresses={receive}
                    locked={isDeviceLocked}
                    pendingAddresses={pendingAddresses}
                />
            </Column>

            <ConfirmEvmExplanationModal account={account} route="wallet-receive" />
        </WalletLayout>
    );
};
