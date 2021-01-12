import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { NotificationCard, Translation } from '@suite-components';
import * as blockchainActions from '@wallet-actions/blockchainActions';

import { AppState, Dispatch } from '@suite-types';

const mapStateToProps = (state: AppState) => ({
    blockchain: state.wallet.blockchain,
    selectedAccount: state.wallet.selectedAccount,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            reconnect: blockchainActions.reconnect,
        },
        dispatch,
    );

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const Disconnected = ({ selectedAccount, reconnect, blockchain }: Props) => {
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
            data-test="@notification/backend-disconnected"
        >
            <Translation id="TR_BACKEND_DISCONNECTED" />
            {displayTime}
        </NotificationCard>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Disconnected);
