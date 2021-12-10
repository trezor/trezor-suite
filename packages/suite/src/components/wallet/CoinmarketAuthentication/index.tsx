import React, { useEffect, useState } from 'react';
import invityAPI from '@suite-services/invityAPI';
import { useSelector } from '@suite-hooks';
import { useEffectOnce } from 'react-use';

// TODO: move interfaces/types to types folder

export interface AccountInfo {
    id: string;
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
    whoAmI?: WhoAmI;
    fetching: boolean;
    checkWhoAmI: () => void;
}

export const CoinmarketAuthenticationContext =
    React.createContext<CoinmarketAuthenticationContextProps>({
        fetching: true,
        checkWhoAmI: () => {},
    });

function inIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

interface CoinmarketAuthenticationProps {
    checkWhoAmImmediately?: boolean;
}

const CoinmarketAuthentication: React.FC<CoinmarketAuthenticationProps> = ({
    children,
    checkWhoAmImmediately = true,
}) => {
    const { invityEnvironment } = useSelector(state => ({
        invityEnvironment: state.suite.settings.debug.invityServerEnvironment,
    }));
    if (invityEnvironment) {
        invityAPI.setInvityServersEnvironment(invityEnvironment);
    }
    const [whoAmI, setWhoAmI] = useState<WhoAmI>();
    const [fetching, setFetching] = useState(checkWhoAmImmediately);
    const [checkCounter, setCheckCounter] = useState(0);

    const checkWhoAmI = () => {
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
                        checkWhoAmI();
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
                    let whoAmI: WhoAmI = await whoAmIResponse.json();
                    console.log('fetched data from who am i', whoAmI);
                    if (whoAmI.error) {
                        whoAmI.active = false;
                    }
                    console.log('WHoAmIContext data', whoAmI);
                    if (whoAmI.identity && whoAmI.active) {
                        whoAmI.verified = whoAmI.identity.verifiable_addresses[0].verified;
                    } else {
                        whoAmI.verified = false;
                    }
                    invityAPI.setProtectedAPI(whoAmI.verified || false);
                    if (whoAmI.verified) {
                        whoAmI.email = whoAmI.identity?.traits.email;
                        const info = await loadAccountInfo();
                        invityAPI.setProtectedAPI(false);
                        whoAmI = { ...whoAmI, ...info };
                    }
                    setWhoAmI(whoAmI);
                } catch (error) {
                    const reason = error instanceof Object ? error.toString() : '';
                    setWhoAmI({ error: { code: 503, status: 'Error', reason } });
                    invityAPI.setProtectedAPI(false);
                }
            }
            setFetching(false);
        };
        if (checkWhoAmImmediately || checkCounter > 0) {
            fetchWhoami();
        }
    }, [checkCounter, checkWhoAmImmediately]);

    return (
        <CoinmarketAuthenticationContext.Provider value={{ whoAmI, fetching, checkWhoAmI }}>
            {children}
        </CoinmarketAuthenticationContext.Provider>
    );
};

export default CoinmarketAuthentication;
