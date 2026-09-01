import { selectFullSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { selectBlockchainState } from '@suite-common/wallet-core';
import { isTrezorConnectBackendType, tryGetAccountIdentity } from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';

import { useBackendReconnection } from 'src/hooks/settings/backends';
import { useSelector } from 'src/hooks/suite';
import { selectIsSuiteOnline } from 'src/selectors/suite/suiteSelectors';

const DisconnectedNotification = ({
    symbol,
    identity,
    resolveTime,
}: {
    symbol: NetworkSymbol;
    identity?: string;
    resolveTime: number | undefined;
}) => {
    const { reconnect, isReconnecting, countdownSeconds } = useBackendReconnection(
        symbol,
        identity,
        resolveTime,
    );

    return (
        <Banner
            intent="warning"
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

    const chain =
        (identity && blockchain[symbol]?.identityConnections?.[identity]) ?? blockchain[symbol];

    if (!chain || chain.connected) return null;

    return (
        <DisconnectedNotification
            symbol={symbol}
            identity={identity}
            resolveTime={chain.reconnectionTime}
        />
    );
};
