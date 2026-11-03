import { type DeviceRootState, selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, type DiscoveryRootState } from '@suite-common/wallet-core';
import { isWalletConnectSupportedNetwork } from '@suite-common/walletconnect';
import { selectIsDeviceReadyToUseAndAuthorized } from '@suite-native/device';

export type AppConnectionState = DeviceRootState & AccountsRootState & DiscoveryRootState;

/**
 * Connecting to an external app (WalletConnect, Trezor Connect) needs a real device
 * that is ready to be used, so a portfolio tracker never gets these actions.
 */
export const selectIsAppConnectionAvailable = (state: AppConnectionState) =>
    !selectIsPortfolioTrackerDevice(state) && selectIsDeviceReadyToUseAndAuthorized(state);

export const selectIsWalletConnectAvailable = (state: AppConnectionState, symbol: NetworkSymbol) =>
    isWalletConnectSupportedNetwork(symbol) && selectIsAppConnectionAvailable(state);
