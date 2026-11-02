import { mock } from '@trezor/dependency-injection';
import type {
    GetCryptoIcon,
    GetNetworkIcon,
    GetTokenLogoIdentifiers,
    HasCryptoIcon,
    NetworkIconModule,
} from '@trezor/network-assets-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

export const mockNetworkIcon = (overrides: Partial<NetworkIconModule> = {}): NetworkIconModule => ({
    getCryptoIcon: mock<GetCryptoIcon>(() => 'coin.svg'),
    getNetworkIcon: mock<GetNetworkIcon>(() => 'network.svg'),
    hasCryptoIcon: mock<HasCryptoIcon>(() => true),
    hasNetworkIcon: (_symbol): _symbol is NetworkSymbol => true,
    getTokenLogoIdentifiers: mock<GetTokenLogoIdentifiers>(() => []),
    ...overrides,
});
