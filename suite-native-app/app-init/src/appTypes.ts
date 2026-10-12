export enum ConnectAndBlockchainInitializationStatus {
    Pending = 'pending',
    Ready = 'ready',
    Unavailable = 'unavailable',
}

export type ConnectAndBlockchainInitializationResult =
    | ConnectAndBlockchainInitializationStatus.Ready
    | ConnectAndBlockchainInitializationStatus.Unavailable;
