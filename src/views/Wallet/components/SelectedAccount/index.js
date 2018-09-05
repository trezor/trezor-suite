/* @flow */
import * as React from 'react';
import { Notification } from 'components/Notification';

import type { State } from 'flowtype';

export type StateProps = {
    className: string;
    selectedAccount: $ElementType<State, 'selectedAccount'>,
    wallet: $ElementType<State, 'wallet'>,
    children?: React.Node
}

export type DispatchProps = {

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
    } = accountState;

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
        } if (discovery.waitingForBackend) {
            // case 4: backend is not working
            return (
                <Notification type="warning" title="Backend not working" />
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