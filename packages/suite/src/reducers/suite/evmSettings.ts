import { type NetworkSymbol } from '@suite-common/wallet-config';

export interface EvmSettings {
    confirmExplanationModalClosed: Partial<Record<NetworkSymbol, Record<string, boolean>>>;
    explanationBannerClosed: Partial<Record<NetworkSymbol, boolean>>;
}
