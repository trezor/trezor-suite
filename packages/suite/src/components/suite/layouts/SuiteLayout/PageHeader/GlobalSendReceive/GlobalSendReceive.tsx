import { memo } from 'react';

import { selectAllAccountsToList } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useDevice } from '@suite/device';

import { resetProtocol } from 'src/actions/suite/protocolActions';
import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { globalSendReceiveFilters } from 'src/slices/wallet/globalSendReceiveFilters';
import { type AccountItemType } from 'src/types/wallet';

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

    const buttonIntent = device?.connected && device?.available ? 'brand' : 'neutral';
    const buttonPriority = device?.connected && device?.available ? 'primary' : 'secondary';
    // When there is nothing to send (no accounts yet or all accounts empty) we demote the Send
    // button so Receive stands out as the primary action.
    const hasNothingToSend = accounts.length === 0 || accounts.every(a => a.empty);

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
                hasNothingToSend={hasNothingToSend}
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
