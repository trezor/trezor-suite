export enum TorStatus {
    Enabled = 'Enabled',
    Disabled = 'Disabled',
    Disabling = 'Disabling',
    Enabling = 'Enabling',
    Error = 'Error',
    Slow = 'Slow',
}

export interface TorBootstrap {
    current: number;
    total: number;
    isSlow?: boolean;
}
