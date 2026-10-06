export enum AppServicesInitializationStatus {
    Idle = 'idle',
    Initializing = 'initializing',
    Ready = 'ready',
    ConnectError = 'connect-error',
    BlockchainError = 'blockchain-error',
    Error = 'error',
    Disabled = 'disabled',
}

export type AppServicesInitializationResult =
    AppServicesInitializationStatus.Ready | AppServicesInitializationStatus.Disabled;

export type AppServicesInitializationError =
    | AppServicesInitializationStatus.ConnectError
    | AppServicesInitializationStatus.BlockchainError
    | AppServicesInitializationStatus.Error;
