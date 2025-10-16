import { useState } from 'react';

import { Account } from '@suite-common/wallet-types';
import { EventType, analytics } from '@trezor/suite-analytics';

import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { useDevice } from 'src/hooks/suite';
import { LocalAccountSearchProvider } from 'src/hooks/suite/useAccountSearch';
import { AccountItemType } from 'src/types/wallet';

import { useGoToWithAnalytics } from '../useGoToWithAnalytics';
import { GlobalReceiveModal } from './GlobalReceiveModal';
import { GlobalSendModal } from './GlobalSendModal';
import { GlobalSendReceiveButtons } from './GlobalSendReceiveButtons';

export const GlobalSendReceive = () => {
    const { device } = useDevice();

    const goToWithAnalytics = useGoToWithAnalytics();
    const buttonIntent = device?.connected && device?.available ? 'brand' : 'neutral';
    const buttonPriority = device?.connected && device?.available ? 'primary' : 'secondary';
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

    const handleSendCancel = (filledSearch: boolean) => {
        setIsSendModalOpen(false);

        analytics.report({
            type: EventType.DashboardSendModalOptions,
            payload: {
                option: 'close',
                filledSearch,
            },
        });
    };

    const handleSendSubmit = (account: Account, type: AccountItemType, filledSearch: boolean) => {
        setIsSendModalOpen(false);

        analytics.report({
            type: EventType.DashboardSendModalOptions,
            payload: {
                option: 'account',
                filledSearch,
            },
        });

        goToWithAnalytics(type === 'tokens' ? 'wallet-tokens' : 'wallet-send', {
            params: {
                symbol: account.symbol,
                accountIndex: account.index,
                accountType: account.accountType,
            },
        });
    };

    const handleReceiveCancel = (filledSearch: boolean) => {
        setIsReceiveModalOpen(false);

        analytics.report({
            type: EventType.DashboardReceiveModalOptions,
            payload: {
                option: 'close',
                filledSearch,
            },
        });
    };

    const handleReceiveSubmit = (
        account: Account,
        type: AccountItemType,
        filledSearch: boolean,
    ) => {
        setIsReceiveModalOpen(false);

        analytics.report({
            type: EventType.DashboardReceiveModalOptions,
            payload: {
                option: 'account',
                filledSearch,
            },
        });

        goToWithAnalytics(type === 'tokens' ? 'wallet-tokens' : 'wallet-receive', {
            params: {
                symbol: account.symbol,
                accountIndex: account.index,
                accountType: account.accountType,
            },
        });
    };

    return (
        <AppNavigationTooltip>
            <GlobalSendReceiveButtons
                setIsSendModalOpen={setIsSendModalOpen}
                setIsReceiveModalOpen={setIsReceiveModalOpen}
                intent={buttonIntent}
                priority={buttonPriority}
            />
            {isSendModalOpen && (
                <LocalAccountSearchProvider>
                    <GlobalSendModal onCancel={handleSendCancel} onSubmit={handleSendSubmit} />
                </LocalAccountSearchProvider>
            )}
            {isReceiveModalOpen && (
                <LocalAccountSearchProvider>
                    <GlobalReceiveModal
                        onCancel={handleReceiveCancel}
                        onSubmit={handleReceiveSubmit}
                    />
                </LocalAccountSearchProvider>
            )}
        </AppNavigationTooltip>
    );
};
