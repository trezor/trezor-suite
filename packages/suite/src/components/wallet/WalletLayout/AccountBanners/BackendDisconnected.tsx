import { selectFullSelectedAccount, selectSelectedAccountBlockchainInfo } from '@suite/account';
import { Translation } from '@suite/intl';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { isTrezorConnectBackendType, tryGetAccountIdentity } from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';

import { useBackendReconnection } from '#src/hooks/settings/backends/useBackendReconnection';
import { useSelector } from '#src/hooks/suite/useSelector';
import { selectIsSuiteOnline } from '#src/selectors/suite/suiteSelectors';

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
    const { reconnect, isReconnecting, countdownSeconds } = useBackendReconnection(
        symbol,
        identity,
        resolveTime,
    );

    return (
        <Banner
            intent="warning"
            data-testid="@wallet/account-banner/backend-disconnected"
            rightContent={
                <Banner.Button onClick={reconnect} isLoading={isReconnecting}>
                    <Translation id="TR_CONNECT" />
                </Banner.Button>
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
    const networkBlockchain = useSelector(selectSelectedAccountBlockchainInfo);
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
