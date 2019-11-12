interface ConnectEvent {
    foo: boolean;
}

export interface Events {
    connect: ConnectEvent;
    disconnect: any;
    notification: any;
    block: any;
}
