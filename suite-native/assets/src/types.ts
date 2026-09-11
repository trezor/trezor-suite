import { type DeviceRootState } from '@suite-common/device';
import { type NetworksRootState } from '@suite-common/networks';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type DiscoveryRootState,
    type FiatRatesRootState,
    type StakeRootState,
    type WalletSettingsRootState,
} from '@suite-common/wallet-core';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';

export interface AssetType {
    symbol: NetworkSymbol;
    assetBalance: string;
    fiatBalance: BaseCurrencyAmount | null;
}

export type AssetFiatPercentage = {
    fiatPercentage: number;
    fiatPercentageOffset: number;
};

export type AssetsRootState = AccountsRootState &
    FiatRatesRootState &
    WalletSettingsRootState &
    TokenDefinitionsRootState &
    StakeRootState &
    DeviceRootState &
    DiscoveryRootState &
    NetworksRootState;
