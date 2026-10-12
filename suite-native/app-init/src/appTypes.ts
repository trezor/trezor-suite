export enum ConnectAndBlockchainInitializationStatus {
    Idle = 'idle',
    Initializing = 'initializing',
    Ready = 'ready',
    ConnectError = 'connect-error',
    BlockchainError = 'blockchain-error',
    Error = 'error',
    Disabled = 'disabled',
}

export type ConnectAndBlockchainInitializationResult =
    | ConnectAndBlockchainInitializationStatus.Ready
    | ConnectAndBlockchainInitializationStatus.Disabled;

export type ConnectAndBlockchainInitializationError =
    | ConnectAndBlockchainInitializationStatus.ConnectError
    | ConnectAndBlockchainInitializationStatus.BlockchainError
    | ConnectAndBlockchainInitializationStatus.Error;
