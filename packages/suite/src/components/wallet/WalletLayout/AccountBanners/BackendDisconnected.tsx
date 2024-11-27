import { tryGetAccountIdentity, isTrezorConnectBackendType } from '@suite-common/wallet-utils';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { Banner } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useBackendReconnection } from 'src/hooks/settings/backends';

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
            variant="warning"
            rightContent={
                <Banner.Button onClick={reconnect} isLoading={isReconnecting}>
                    <Translation id="TR_CONNECT" />
                </Banner.Button>
            }
        >
            <Translation id="TR_BACKEND_DISCONNECTED" />
            {countdownSeconds ? (
                <Translation id="TR_BACKEND_RECONNECTING" values={{ time: countdownSeconds }} />
            ) : null}
        </Banner>
    );
};

export const BackendDisconnected = () => {
    const blockchain = useSelector(state => state.wallet.blockchain);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const online = useSelector(state => state.suite.online);

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
