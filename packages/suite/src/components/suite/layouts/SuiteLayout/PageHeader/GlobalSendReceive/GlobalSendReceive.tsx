import { memo } from 'react';

import { useDevice } from '@suite/device';
import { selectAllAccountsToList } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { resetProtocol } from 'src/actions/suite/protocolActions';
import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { globalSendReceiveFilters } from 'src/slices/wallet/globalSendReceiveFilters';
import { type AccountItemType } from 'src/types/wallet';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

import { GlobalReceiveModal } from './GlobalReceiveModal/GlobalReceiveModal';
import { GlobalSendModal } from './GlobalSendModal/GlobalSendModal';
import { GlobalSendReceiveButtons } from './GlobalSendReceiveButtons';
import { useGlobalSendReceiveAnalytics } from './hooks/useGlobalSendReceiveAnalytics';
import { useGlobalSendReceiveModal } from './hooks/useGlobalSendReceiveModal';

export const GlobalSendReceive = memo(function GlobalSendReceiveInner() {
    const { device } = useDevice();
    const { activeModal, openModal, closeModal } = useGlobalSendReceiveModal();
    const { sendAnalytics, receiveAnalytics } = useGlobalSendReceiveAnalytics();
    const dispatch = useDispatch();
    const accounts = useSelector(selectAllAccountsToList);
    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);

    const isDeviceConnected = !!device?.connected && !!device?.available;
    // The dashboard shows the `EmptyWallet` screen (with its own primary Buy/Receive CTAs)
    // when discovery has finished and every account is empty. In that case we demote the
    // header Send/Receive buttons so the EmptyWallet CTAs stand out and we avoid two
    // competing primary calls-to-action on the same page.
    const isEmptyWalletShown =
        discoveryStatus === undefined && accounts.length > 0 && accounts.every(a => a.empty);
    const shouldPromoteButtons = isDeviceConnected && !isEmptyWalletShown;
    const buttonIntent = shouldPromoteButtons ? 'brand' : 'neutral';
    const buttonPriority = shouldPromoteButtons ? 'primary' : 'secondary';

    const handleSendSubmit = (account: Account, filledSearch: boolean) => {
        sendAnalytics.account(filledSearch);
        closeModal('wallet-send', account);
    };

    const handleReceiveSubmit = (
        account: Account,
        type: AccountItemType,
        filledSearch: boolean,
    ) => {
        receiveAnalytics.account(filledSearch);
        closeModal(type === 'tokens' ? 'wallet-tokens' : 'wallet-receive', account);
    };

    const handleSendCancel = (filledSearch: boolean) => {
        sendAnalytics.close(filledSearch);
        closeModal();
        dispatch(resetProtocol());
        dispatch(globalSendReceiveFilters.actions.resetFilters());
    };

    const handleReceiveCancel = (filledSearch: boolean) => {
        receiveAnalytics.close(filledSearch);
        closeModal();
        dispatch(globalSendReceiveFilters.actions.resetFilters());
    };

    return (
        <AppNavigationTooltip>
            <GlobalSendReceiveButtons
                setActiveModal={modal => {
                    openModal(modal);
                }}
                intent={buttonIntent}
                priority={buttonPriority}
            />
            {activeModal === 'send' && (
                <GlobalSendModal onCancel={handleSendCancel} onSubmit={handleSendSubmit} />
            )}
            {activeModal === 'receive' && (
                <GlobalReceiveModal onCancel={handleReceiveCancel} onSubmit={handleReceiveSubmit} />
            )}
        </AppNavigationTooltip>
    );
});
