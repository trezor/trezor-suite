import { useState } from 'react';

import { sendFormActions } from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';

import { SUITE } from 'src/actions/suite/constants';
import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { useDevice, useDispatch } from 'src/hooks/suite';

import { useGoToWithAnalytics } from '../useGoToWithAnalytics';
import { GlobalReceiveModal } from './GlobalReceiveModal';
import { GlobalSendModal } from './GlobalSendModal';
import { GlobalSendReceiveButtons } from './GlobalSendReceiveButtons';

export const GlobalSendReceive = () => {
    const { device } = useDevice();
    const dispatch = useDispatch();
    const goToWithAnalytics = useGoToWithAnalytics();
    const buttonVariant = device?.connected && device?.available ? 'primary' : 'tertiary';
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

    const prepareTokenSend = (account: Account, tokenAddress: TokenAddress) => {
        dispatch({
            type: SUITE.SET_SEND_FORM_PREFILL,
            payload: tokenAddress,
        });
        dispatch(
            sendFormActions.removeDraft({
                accountKey: account.key,
            }),
        );
    };

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
                    onSubmit={(account, _, tokenAddress) => {
                        if (tokenAddress) {
                            prepareTokenSend(account, tokenAddress);
                        }
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
                    onSubmit={(account, _, tokenAddress) => {
                        if (tokenAddress) {
                            prepareTokenSend(account, tokenAddress);
                        }
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
