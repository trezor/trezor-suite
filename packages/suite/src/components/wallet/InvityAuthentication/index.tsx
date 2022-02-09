import React, { useEffect, useState } from 'react';
import { useActions, useSelector } from '@suite-hooks';
import { useEffectOnce } from 'react-use';
import { AccountSettings } from '@wallet-types/invity';
import * as notificationActions from '@suite-actions/notificationActions';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import { useInvityNavigation } from '@wallet-hooks/useInvityNavigation';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';
import type { AppState } from '@suite-types';
import invityAPI from '@suite/services/suite/invityAPI';
// TODO: move interfaces/types to types folder

export interface AccountInfo {
    id: string;
    settings: AccountSettings;
}

export interface InvityAuthenticationContextProps {
    iframeMessage?: IframeMessage;
}

export const InvityAuthenticationContext = React.createContext<InvityAuthenticationContextProps>(
    {},
);

const inIframe = () => {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
};

interface IframeMessage {
    name: 'invity-authentication';
    action?:
        | 'loading'
        | 'loaded'
        | 'resize'
        | 'registration-successful'
        | 'login-successful'
        | 'logout-successful';
    data?: any;
}

export interface InvityAuthenticationProps {
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
    // TODO: Do we really need this?
    checkInvityAuthenticationImmediately?: boolean;
    redirectUnauthorizedUserToLogin?: boolean;
}

const InvityAuthentication: React.FC<InvityAuthenticationProps> = ({
    children,
    selectedAccount,
    checkInvityAuthenticationImmediately = true,
    redirectUnauthorizedUserToLogin = false,
}) => {
    const [iframeMessage, setIframeMessage] = useState<IframeMessage>();
    const { account } = selectedAccount;
    const { invityAuthentication, selectedProvider, invityServerEnvironment } = useSelector(
        state => ({
            invityServerEnvironment: state.suite.settings.debug.invityServerEnvironment,
            invityAuthentication: state.wallet.coinmarket.invityAuthentication,
            selectedProvider: state.wallet.coinmarket.savings.selectedProvider,
        }),
    );

    if (invityServerEnvironment) {
        invityAPI.setInvityServersEnvironment(invityServerEnvironment);
    }

    const {
        loadInvityAuthentication,
        saveInvityAuthentication,
        addToast,
        loadSavingsTrade,
        loadInvityData,
    } = useActions({
        loadInvityAuthentication: coinmarketCommonActions.loadInvityAuthentication,
        saveInvityAuthentication: coinmarketCommonActions.saveInvityAuthentication,
        loadInvityData: coinmarketCommonActions.loadInvityData,
        loadSavingsTrade: coinmarketSavingsActions.loadSavingsTrade,
        addToast: notificationActions.addToast,
    });
    const { navigateToInvityRegistrationSuccessful } = useInvityNavigation(account);
    const { navigateToSavings } = useCoinmarketNavigation(account);

    useEffectOnce(() => {
        const messageHandler = (event: MessageEvent) => {
            // Listen for iframe messages and redirect after user has logged in
            try {
                // There are different messages (e.g. from Hotjar), not all of them return JSON
                const message: IframeMessage = JSON.parse(event.data);
                if (message && message.name === 'invity-authentication') {
                    setIframeMessage(message);
                }
                // eslint-disable-next-line no-empty
            } catch {}
        };

        window.addEventListener('message', messageHandler);
        return () => window.removeEventListener('message', messageHandler);
    });

    useEffect(() => {
        loadInvityData();
    }, [loadInvityData]);

    useEffect(() => {
        if (iframeMessage) {
            switch (iframeMessage.action) {
                case 'registration-successful':
                    navigateToInvityRegistrationSuccessful();
                    break;
                case 'login-successful': {
                    if (invityAuthentication && selectedProvider) {
                        loadSavingsTrade(selectedProvider.name);
                    } else {
                        loadInvityAuthentication(redirectUnauthorizedUserToLogin);
                    }
                    break;
                }
                case 'logout-successful':
                    if (invityAuthentication) {
                        saveInvityAuthentication(undefined);
                    } else {
                        addToast({
                            type: 'invity-logout-successful',
                        });
                    }
                    break;
                // eslint-disable-next-line no-fallthrough
                default:
            }
        }
    }, [
        addToast,
        iframeMessage,
        invityAuthentication,
        loadInvityAuthentication,
        loadSavingsTrade,
        navigateToInvityRegistrationSuccessful,
        navigateToSavings,
        redirectUnauthorizedUserToLogin,
        saveInvityAuthentication,
        selectedProvider,
    ]);

    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            !inIframe() &&
            (!invityAuthentication || checkInvityAuthenticationImmediately)
        ) {
            loadInvityAuthentication(redirectUnauthorizedUserToLogin);
        }
    }, [
        checkInvityAuthenticationImmediately,
        invityAuthentication,
        loadInvityAuthentication,
        redirectUnauthorizedUserToLogin,
    ]);

    return (
        <InvityAuthenticationContext.Provider value={{ iframeMessage }}>
            {children}
        </InvityAuthenticationContext.Provider>
    );
};

export default InvityAuthentication;
