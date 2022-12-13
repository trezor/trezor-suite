import React, { useState, useEffect } from 'react';
import { NotificationCard, Translation } from '@suite-components';
import { useSelector, useActions } from '@suite-hooks';
import { reconnectBlockchainThunk } from '@suite-common/wallet-core';
import { isTrezorConnectBackendType } from '@suite-common/wallet-utils';

const Disconnected = () => {
    const { reconnect } = useActions({
        reconnect: reconnectBlockchainThunk,
    });
    const { blockchain, selectedAccount, online } = useSelector(state => ({
        blockchain: state.wallet.blockchain,
        selectedAccount: state.wallet.selectedAccount,
        online: state.suite.online,
    }));
    const [progress, setProgress] = useState(false);
    const [time, setTime] = useState<number | null>(null);
    const symbol = selectedAccount.status === 'loaded' ? selectedAccount.network.symbol : undefined;
    const reconnection =
        symbol && blockchain[symbol] && blockchain[symbol].reconnection
            ? blockchain[symbol].reconnection
            : undefined;
    const resolveTime = reconnection ? reconnection.time : 0;
    useEffect(() => {
        const interval = setInterval(() => {
            const secToResolve = Math.round((resolveTime - new Date().getTime()) / 1000);
            setTime(secToResolve);
        }, 500);
        return () => {
            clearInterval(interval);
        };
    }, [resolveTime]);

    if (selectedAccount.status !== 'loaded') return null;
    // TODO handle non-standard backends differently
    if (!isTrezorConnectBackendType(selectedAccount.account.backendType)) return null;
    if (symbol && blockchain[symbol]?.connected) return null;
    if (!online) return null;

    const { network } = selectedAccount;
    const click = async () => {
        setProgress(true);
        const r: any = await reconnect(network.symbol);
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

export default Disconnected;
