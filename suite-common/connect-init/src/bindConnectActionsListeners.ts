import TrezorConnect, {
    BLOCKCHAIN_EVENT,
    DEVICE_EVENT,
    TRANSPORT_EVENT,
    UI_EVENT,
    BlockchainEvent,
    DeviceEvent,
    TransportEvent,
    UiEvent,
} from '@trezor/connect';

export type ConnectEventAction = DeviceEvent | TransportEvent | BlockchainEvent | UiEvent;

export const bindConnectActionsListeners = ({
    onEvent,
}: {
    onEvent: (action: ConnectEventAction) => void;
}) => {
    // set event listeners and dispatch as
    TrezorConnect.on(DEVICE_EVENT, ({ event: _, ...action }) => {
        // dispatch event as action
        onEvent(action);
    });

    TrezorConnect.on(UI_EVENT, ({ event: _, ...action }) => {
        // dispatch event as action
        onEvent(action);
    });

    TrezorConnect.on(TRANSPORT_EVENT, ({ event: _, ...action }) => {
        // dispatch event as action
        onEvent(action);
    });

    TrezorConnect.on(BLOCKCHAIN_EVENT, ({ event: _, ...action }) => {
        // dispatch event as action
        onEvent(action);
    });
};
