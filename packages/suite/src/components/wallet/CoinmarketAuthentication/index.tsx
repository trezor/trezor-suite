import React, { useEffect, useState } from 'react';
import invityAPI from '@suite-services/invityAPI';
import { useActions, useSelector } from '@suite-hooks';
import { useEffectOnce } from 'react-use';
import { AccountSettings } from '@wallet-types/invity';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
// TODO: move interfaces/types to types folder

export interface AccountInfo {
    id: string;
    settings: AccountSettings;
}

export interface WhoAmI {
    // properties from kratos
    id?: string;
    active?: boolean;
    identity?: {
        id: string;
        traits: { [key: string]: string };
        // eslint-disable-next-line camelcase
        verifiable_addresses: Array<Record<string, any>>;
    };
    error?: {
        code: number;
        status: string;
        reason: string;
    };
    // properties from API server or calculated
    verified?: boolean;
    email?: string;
    accountInfo?: AccountInfo;
}

export interface CoinmarketAuthenticationContextProps {
    invityAuthentication?: WhoAmI;
    fetching: boolean;
    checkInvityAuthentication: () => void;
}

export const CoinmarketAuthenticationContext =
    React.createContext<CoinmarketAuthenticationContextProps>({
        fetching: true,
        checkInvityAuthentication: () => {},
    });

function inIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

interface CoinmarketAuthenticationProps {
    checkInvityAuthenticationImmediately?: boolean;
}

const CoinmarketAuthentication: React.FC<CoinmarketAuthenticationProps> = ({
    children,
    checkInvityAuthenticationImmediately = true,
}) => {
    const { invityEnvironment, invityAuthentication } = useSelector(state => ({
        invityEnvironment: state.suite.settings.debug.invityServerEnvironment,
        invityAuthentication: state.wallet.coinmarket.invityAuthentication,
    }));
    if (invityEnvironment) {
        invityAPI.setInvityServersEnvironment(invityEnvironment);
    }
    const { saveInvityAuthentication } = useActions({
        saveInvityAuthentication: coinmarketCommonActions.saveInvityAuthentication,
    });
    const [fetching, setFetching] = useState(checkInvityAuthenticationImmediately);
    const [checkCounter, setCheckCounter] = useState(0);

    const checkInvityAuthentication = () => {
        setCheckCounter(checkCounter + 1);
    };

    useEffectOnce(() => {
        const messageHandler = (event: MessageEvent) => {
            // Listen for iframe messages and redirect after user has logged in
            let parsedData: any;
            try {
                // There are different messages (e.g. from Hotjar), not all of them return JSON
                parsedData = JSON.parse(event.data);
                // eslint-disable-next-line no-empty
            } catch {}
            if (parsedData && parsedData.name === 'invity-authentication') {
                switch (parsedData.state) {
                    case 'login-successful':
                    case 'registration-successful':
                        checkInvityAuthentication();
                    // eslint-disable-next-line no-fallthrough
                    default:
                }
            }
        };

        window.addEventListener('message', messageHandler);
        return () => window.removeEventListener('message', messageHandler);
    });

    const loadAccountInfo = async () => {
        try {
            const accountInfoResponse = await invityAPI.accountInfo();
            if (accountInfoResponse.data) {
                const accountInfo = accountInfoResponse.data;

                return {
                    accountInfo,
                };
            }
            return {
                error: {
                    code: 503,
                    status: 'Error',
                    reason: accountInfoResponse.error || '',
                },
            };
        } catch (error) {
            const reason = error instanceof Object ? error.toString() : '';
            return { error: { code: 503, status: 'Error', reason } };
        }
    };

    useEffect(() => {
        const fetchWhoami = async () => {
            setFetching(true);
            // do not call whoami on the server render and in iframe
            if (typeof window !== 'undefined' && !inIframe()) {
                try {
                    const whoAmIResponse = await fetch(invityAPI.getCheckWhoAmIUrl(), {
                        credentials: 'include',
                    });
                    let invityAuthentication: WhoAmI = await whoAmIResponse.json();
                    console.log('fetched data from who am i', invityAuthentication);
                    if (invityAuthentication.error) {
                        invityAuthentication.active = false;
                    }
                    console.log('WHoAmIContext data', invityAuthentication);
                    if (invityAuthentication.identity && invityAuthentication.active) {
                        invityAuthentication.verified =
                            invityAuthentication.identity.verifiable_addresses[0].verified;
                    } else {
                        invityAuthentication.verified = false;
                    }
                    // TODO: get rid off setProtectedAPI -> invityAPI.accountInfo should call itself the right endpoint with right parameters in within fetch(...)
                    // TODO: setProtectedAPI - this is an antipattern, because it mutates state of the InvityAPI instance while it can be used from somewhere else (calling /api/exchange/...).
                    invityAPI.setProtectedAPI(invityAuthentication.verified || false);
                    if (invityAuthentication.verified) {
                        invityAuthentication.email = invityAuthentication.identity?.traits.email;
                        const info = await loadAccountInfo();
                        invityAPI.setProtectedAPI(false);
                        invityAuthentication = { ...invityAuthentication, ...info };
                    }
                    saveInvityAuthentication(invityAuthentication);
                } catch (error) {
                    const reason = error instanceof Object ? error.toString() : '';
                    saveInvityAuthentication({ error: { code: 503, status: 'Error', reason } });
                    invityAPI.setProtectedAPI(false);
                }
            }
            setFetching(false);
        };
        if (checkInvityAuthenticationImmediately || checkCounter > 0) {
            fetchWhoami();
        }
    }, [checkCounter, checkInvityAuthenticationImmediately, saveInvityAuthentication]);

    return (
        <CoinmarketAuthenticationContext.Provider
            value={{ invityAuthentication, fetching, checkInvityAuthentication }}
        >
            {children}
        </CoinmarketAuthenticationContext.Provider>
    );
};

export default CoinmarketAuthentication;
