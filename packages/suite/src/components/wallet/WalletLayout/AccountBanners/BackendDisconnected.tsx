import { selectFullSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import {
    blockchainActions,
    selectBlockchainState,
    selectIsCustomBackendConfigured,
} from '@suite-common/wallet-core';
import { isTrezorConnectBackendType, tryGetAccountIdentity } from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useBackendReconnection } from 'src/hooks/settings/backends';
import { useSelector } from 'src/hooks/suite';
import { selectIsSuiteOnline } from 'src/selectors/suite/suiteSelectors';

type DisconnectedNotificationProps = {
    symbol: NetworkSymbol;
    identity?: string;
    resolveTime: number | undefined;
};

const DisconnectedNotification = ({
    symbol,
    identity,
    resolveTime,
}: DisconnectedNotificationProps) => {
    const { dispatch } = useServices(injectDispatch);
    const { reconnect, isReconnecting, countdownSeconds } = useBackendReconnection(
        symbol,
        identity,
        resolveTime,
    );
    const hasCustomBackend = useSelector(state => selectIsCustomBackendConfigured(state, symbol));

    return (
        <Banner
            intent="warning"
            rightContent={
                <>
                    {hasCustomBackend && (
                        <Banner.Button
                            onClick={() =>
                                dispatch(blockchainActions.setBackend({ symbol, type: 'default' }))
                            }
                            priority="secondary"
                            data-testid="@wallet/backend-disconnected/use-default-backends"
                        >
                            <Translation id="TR_USE_DEFAULT_BACKENDS" />
                        </Banner.Button>
                    )}
                    <Banner.Button onClick={reconnect} isLoading={isReconnecting}>
                        <Translation id="TR_CONNECT" />
                    </Banner.Button>
                </>
            }
            description={
                countdownSeconds ? (
                    <Translation
                        id="TR_BACKEND_DISCONNECTED_RECONNECTING"
                        values={{ time: countdownSeconds }}
                    />
                ) : (
                    <Translation id="TR_BACKEND_DISCONNECTED" />
                )
            }
        />
    );
};

export const BackendDisconnected = () => {
    const blockchain = useSelector(selectBlockchainState);
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const online = useSelector(selectIsSuiteOnline);

    if (!online) return null;

    if (selectedAccount.status !== 'loaded') return null;

    // TODO handle non-standard backends differently
    if (!isTrezorConnectBackendType(selectedAccount.account.backendType)) return null;

    const {
        network: { symbol },
        account,
    } = selectedAccount;

    const identity = tryGetAccountIdentity(account);

    const networkBlockchain = blockchain[symbol as keyof typeof blockchain];
    const chain =
        (identity && networkBlockchain?.identityConnections?.[identity]) ?? networkBlockchain;

    if (!chain || chain.connected) return null;

    return (
        <DisconnectedNotification
            symbol={symbol}
            identity={identity}
            resolveTime={chain.reconnectionTime}
        />
    );
};
