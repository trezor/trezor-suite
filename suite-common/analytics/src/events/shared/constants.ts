export enum EventType {
    WalletConnectInit = 'wallet-connect/init',
    WalletConnectPaired = 'wallet-connect/paired',
    WalletConnectProposal = 'wallet-connect/proposal',
    WalletConnectProposalApproved = 'wallet-connect/proposal-approved',
    WalletConnectProposalRejected = 'wallet-connect/proposal-rejected',
    WalletConnectSessionRequest = 'wallet-connect/session-request',
    WalletConnectError = 'wallet-connect/error',

    SettingsDeviceChangeLabel = 'settings/device/change-label',

    ConnectPopupInit = 'connect-popup/init',
    ConnectPopupPermissions = 'connect-popup/permissions',
    ConnectPopupCall = 'connect-popup/call',
    ConnectPopupError = 'connect-popup/error',
}
