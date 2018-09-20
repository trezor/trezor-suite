/* @flow */
import * as React from 'react';
import { Notification } from 'components/Notification';
import { reconnect } from 'actions/DiscoveryActions';

import type { State } from 'flowtype';

export type StateProps = {
    className: string;
    selectedAccount: $ElementType<State, 'selectedAccount'>,
    wallet: $ElementType<State, 'wallet'>,
    blockchain: $ElementType<State, 'blockchain'>,
    children?: React.Node
}

export type DispatchProps = {
    blockchainReconnect: typeof reconnect;
}

export type Props = StateProps & DispatchProps;

const SelectedAccount = (props: Props) => {
    const device = props.wallet.selectedDevice;
    if (!device || !device.state) {
        return (<Notification type="info" title="Loading device..." />);
    }

    const accountState = props.selectedAccount;

    const {
        account,
        discovery,
        network
    } = accountState;

    if (!network) return; // TODO: this shouldn't happen. change accountState reducer?

    const blockchain = props.blockchain.find(b => b.name === network.network);
    if (blockchain && !blockchain.connected) {
        return (
            <Notification 
                type="error" 
                title="Backend not connected"
                actions={
                    [{
                        label: "Try again",
                        callback: async () => {
                            await props.blockchainReconnect(network.network);
                        }
                    }]
                } />
        );
    }

    // account not found (yet). checking why...
    if (!account) {
        if (!discovery || discovery.waitingForDevice) {
            if (device.connected) {
                // case 1: device is connected but discovery not started yet (probably waiting for auth)
                if (device.available) {
                    return (
                        <Notification type="info" title="Loading accounts..." />
                    );
                }
                // case 2: device is unavailable (created with different passphrase settings) account cannot be accessed
                return (
                    <Notification
                        type="info"
                        title={`Device ${device.instanceLabel} is unavailable`}
                        message="Change passphrase settings to use this device"
                    />
                );
            }
            // case 3: device is disconnected
            return (
                <Notification
                    type="info"
                    title={`Device ${device.instanceLabel} is disconnected`}
                    message="Connect device to load accounts"
                />
            );
        } if (discovery.completed) {
            // case 5: account not found and discovery is completed
            return (
                <Notification type="warning" title="Account does not exist" />
            );
        }
        // case 6: discovery is not completed yet
        return (
            <Notification type="info" title="Loading accounts..." />
        );
    }

    let notification: ?React$Element<typeof Notification> = null;
    if (!device.connected) {
        notification = <Notification type="info" title={`Device ${device.instanceLabel} is disconnected`} />;
    } else if (!device.available) {
        notification = <Notification type="info" title={`Device ${device.instanceLabel} is unavailable`} message="Change passphrase settings to use this device" />;
    }

    if (discovery && !discovery.completed && !notification) {
        notification = <Notification type="info" title="Loading accounts..." />;
    }

    return (
        <section className={props.className}>
            { notification }
            { props.children }
        </section>
    );
};

export default SelectedAccount;