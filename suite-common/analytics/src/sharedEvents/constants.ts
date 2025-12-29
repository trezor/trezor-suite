export enum EventType {
    WalletConnectInit = 'wallet-connect/init',
    WalletConnectPaired = 'wallet-connect/paired',
    WalletConnectProposal = 'wallet-connect/proposal',
    WalletConnectProposalApproved = 'wallet-connect/proposal-approved',
    WalletConnectProposalRejected = 'wallet-connect/proposal-rejected',
    WalletConnectSessionRequest = 'wallet-connect/session-request',
    WalletConnectError = 'wallet-connect/error',

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

//suite-native/state/src/index.ts >
//suite-native/state/src/StoreProvider.tsx >
//suite-native/state/src/BaseStoreProvider.tsx >
//suite-native/state/src/store.ts >
//suite-native/state/src/reducers.ts >
//suite-native/graph/src/index.ts >
//suite-native/graph/src/hooks.ts
