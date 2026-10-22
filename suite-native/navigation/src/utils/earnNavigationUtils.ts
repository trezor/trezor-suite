import { AuthorizeDeviceStackRoutes, PassphraseStackRoutes, RootStackRoutes } from '../routes';

const EARN_OVERLAY_ROUTES = new Set<string>([
    ...Object.values(AuthorizeDeviceStackRoutes),
    ...Object.values(PassphraseStackRoutes),
    RootStackRoutes.FeatureFeedbackModal,
    RootStackRoutes.DeviceCompromisedModal,
    RootStackRoutes.BackupFailedModal,
    RootStackRoutes.TradingLocationModal,
    RootStackRoutes.ConnectPopup,
    RootStackRoutes.ConnectPermissions,
    RootStackRoutes.WalletConnectSessionPopup,
    RootStackRoutes.WalletConnectSwitchAccount,
    RootStackRoutes.WalletConnectPair,
]);

export const isEarnEntryOverlayRoute = (routeName: string | undefined): boolean =>
    routeName !== undefined && EARN_OVERLAY_ROUTES.has(routeName);
