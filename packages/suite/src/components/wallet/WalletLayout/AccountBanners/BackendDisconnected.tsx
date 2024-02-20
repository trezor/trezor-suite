import { useState, useEffect } from 'react';
import { NotificationCard, Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { reconnectBlockchainThunk } from '@suite-common/wallet-core';
import { isTrezorConnectBackendType } from '@suite-common/wallet-utils';
import type { NetworkSymbol } from '@suite-common/wallet-config';

const DisconnectedNotification = ({
    symbol,
    resolveTime = 0,
}: {
    symbol: NetworkSymbol;
    resolveTime: number | undefined;
}) => {
    const [progress, setProgress] = useState(false);
    const [time, setTime] = useState<number>();

    const dispatch = useDispatch();

    useEffect(() => {
        const interval = setInterval(() => {
            const secToResolve = Math.round((resolveTime - new Date().getTime()) / 1000);
            setTime(secToResolve);
        }, 500);

        return () => {
            clearInterval(interval);
        };
    }, [resolveTime]);

    const click = async () => {
        setProgress(true);
        const r: any = await dispatch(reconnectBlockchainThunk(symbol));
        if (!r.success) {
            setProgress(false);
        }
    };

    const isResolving = typeof time === 'number' && time <= 0;
    const displayTime =
        time && !isResolving ? (
            <Translation id="TR_BACKEND_RECONNECTING" values={{ time }} />
        ) : null;

    return (
        <NotificationCard
            variant="warning"
            button={{
                onClick: click,
                isLoading: progress || isResolving,
                children: <Translation id="TR_CONNECT" />,
            }}
        >
            <Translation id="TR_BACKEND_DISCONNECTED" />
            {displayTime}
        </NotificationCard>
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

    const { symbol } = selectedAccount.network;
    const chain = blockchain[symbol];
    if (!chain || chain.connected) return null;

    return <DisconnectedNotification symbol={symbol} resolveTime={chain.reconnection?.time} />;
};
