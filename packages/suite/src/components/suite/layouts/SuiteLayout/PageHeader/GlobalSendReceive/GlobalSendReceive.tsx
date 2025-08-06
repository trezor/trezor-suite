import { useState } from 'react';

import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { useDevice } from 'src/hooks/suite';

import { useGoToWithAnalytics } from '../useGoToWithAnalytics';
import { GlobalReceiveModal } from './GlobalReceiveModal';
import { GlobalSendModal } from './GlobalSendModal';
import { GlobalSendReceiveButtons } from './GlobalSendReceiveButtons';

export const GlobalSendReceive = () => {
    const { device } = useDevice();
    const goToWithAnalytics = useGoToWithAnalytics();
    const buttonVariant = device?.connected && device?.available ? 'primary' : 'tertiary';
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

    return (
        <AppNavigationTooltip>
            <GlobalSendReceiveButtons
                setIsSendModalOpen={setIsSendModalOpen}
                setIsReceiveModalOpen={setIsReceiveModalOpen}
                variant={buttonVariant}
            />
            {isSendModalOpen && (
                <GlobalSendModal
                    onCancel={() => setIsSendModalOpen(false)}
                    onSubmit={account => {
                        setIsSendModalOpen(false);
                        goToWithAnalytics('wallet-send', {
                            params: {
                                symbol: account.symbol,
                                accountIndex: account.index,
                                accountType: account.accountType,
                            },
                        });
                    }}
                />
            )}
            {isReceiveModalOpen && (
                <GlobalReceiveModal
                    onCancel={() => setIsReceiveModalOpen(false)}
                    onSubmit={account => {
                        setIsReceiveModalOpen(false);
                        goToWithAnalytics('wallet-receive', {
                            params: {
                                symbol: account.symbol,
                                accountIndex: account.index,
                                accountType: account.accountType,
                            },
                        });
                    }}
                />
            )}
        </AppNavigationTooltip>
    );
};
