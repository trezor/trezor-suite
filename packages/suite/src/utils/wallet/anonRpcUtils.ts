import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import type { CustomBackend } from '@suite-common/wallet-types';
import type { BlockchainLinkAnonRpc } from '@trezor/connect';

// tor-js runs a Tor client compiled to WebAssembly inside the anon-rpc sandbox, see
// https://github.com/ethereum/anon-rpc/blob/main/adopters.json5.
const TOR_JS_SPECIFIER = '0x700dA3193D35fA54Cd3fBf29B66f2a2A0385659e';

// Browsers cannot open the raw TCP that Tor uses, so tor-js reaches Tor through KPS gateways. This
// one is upstream's demonstration gateway: limited capacity, and it may disappear at any time.
const TOR_JS_DEMO_GATEWAYS = [
    '170.64.236.147:12298:uEiBHwUMNRTetrbqScahm81Di57Xv2OphNrx-CurJGOq3ww',
];

// The specifier is deployed on Ethereum mainnet, so only an Ethereum backend can read it.
export const ANON_RPC_NETWORK_SYMBOLS: NetworkSymbol[] = [asNetworkSymbol('eth')];

type GetAnonRpcSettingsParams = {
    backend: CustomBackend;
    isAnonRpcEnabled: boolean;
};

export const getAnonRpcSettings = ({
    backend,
    isAnonRpcEnabled,
}: GetAnonRpcSettingsParams): BlockchainLinkAnonRpc | undefined => {
    if (!isAnonRpcEnabled || backend.type !== 'evm-rpc') {
        return undefined;
    }

    if (!ANON_RPC_NETWORK_SYMBOLS.includes(backend.symbol)) {
        return undefined;
    }

    const [bootstrapRpcUrl] = backend.urls;
    if (!bootstrapRpcUrl) {
        return undefined;
    }

    return {
        specifier: TOR_JS_SPECIFIER,
        // Upstream asks for the provider you already rely on: the user's own backend, which already
        // receives all of this traffic. The one read it serves is not anonymized.
        bootstrapRpcUrl,
        config: { gateways: TOR_JS_DEMO_GATEWAYS },
    };
};
