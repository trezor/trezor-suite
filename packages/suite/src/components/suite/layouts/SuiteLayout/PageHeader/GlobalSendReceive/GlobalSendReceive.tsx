import { memo } from 'react';

import { Account } from '@suite-common/wallet-types';

import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { useDevice } from 'src/hooks/suite';
import { AccountItemType } from 'src/types/wallet';

import { GlobalReceiveModal } from './GlobalReceiveModal/GlobalReceiveModal';
import { GlobalSendModal } from './GlobalSendModal/GlobalSendModal';
import { GlobalSendReceiveButtons } from './GlobalSendReceiveButtons';
import { useGlobalSendReceiveAnalytics } from './hooks/useGlobalSendReceiveAnalytics';
import { useGlobalSendReceiveModal } from './hooks/useGlobalSendReceiveModal';

export const GlobalSendReceive = memo(function GlobalSendReceiveInner() {
    const { device } = useDevice();
    const { activeModal, openModal, closeModal } = useGlobalSendReceiveModal();
    const { sendAnalytics, receiveAnalytics } = useGlobalSendReceiveAnalytics();

    const buttonIntent = device?.connected && device?.available ? 'brand' : 'neutral';
    const buttonPriority = device?.connected && device?.available ? 'primary' : 'secondary';

    const handleSendSubmit = (account: Account, type: AccountItemType, filledSearch: boolean) => {
        sendAnalytics.account(filledSearch);
        closeModal(type === 'tokens' ? 'wallet-tokens' : 'wallet-send', account);
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
    };

    const handleReceiveCancel = (filledSearch: boolean) => {
        receiveAnalytics.close(filledSearch);
        closeModal();
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
