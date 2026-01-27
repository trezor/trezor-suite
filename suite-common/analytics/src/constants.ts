export enum EventType {
    WalletConnectInit = 'wallet-connect/init',
    WalletConnectPaired = 'wallet-connect/paired',
    WalletConnectProposal = 'wallet-connect/proposal',
    WalletConnectProposalApproved = 'wallet-connect/proposal-approved',
    WalletConnectProposalRejected = 'wallet-connect/proposal-rejected',
    WalletConnectSessionRequest = 'wallet-connect/session-request',

    SettingsDeviceChangeLabel = 'settings/device/change-label',
    SettingsDeviceWipe = 'settings/device/wipe',

    ConnectPopupInit = 'connect-popup/init',
    ConnectPopupPermissions = 'connect-popup/permissions',
    ConnectPopupCall = 'connect-popup/call',
    ConnectPopupError = 'connect-popup/error',

    DeviceConnectionDeviceFound = 'device-connection/device-found',
    DeviceConnectionDevicePaired = 'device-connection/device-paired',
    DeviceConnectionDeviceConfirmation = 'device-connection/device-confirmation',
}
