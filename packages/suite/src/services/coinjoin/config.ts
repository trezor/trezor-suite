import type { CoinjoinBackendSettings, CoinjoinClientSettings } from '@trezor/coinjoin';
import type { PartialRecord } from '@trezor/type-utils';
import type { CoinjoinServerEnvironment } from '@suite-common/wallet-types';
import type { NetworkSymbol } from '@wallet-types';

type CoinjoinNetworksConfig = CoinjoinBackendSettings &
    CoinjoinClientSettings & {
        percentageFee: string;
    };

type ServerEnvironment = PartialRecord<CoinjoinServerEnvironment, CoinjoinNetworksConfig>;

export const COINJOIN_NETWORKS: PartialRecord<NetworkSymbol, ServerEnvironment> = {
    // btc: https://wasabiwallet.io/ (tor http://wasabiukrxmkdgve5kynjztuovbg43uxcbcxn6y2okcrsg7gb6jdmbad.onion/)
    // available only in @suite-desktop
    // browser throws: Access to XMLHttpRequest at 'https://wasabiwallet.co/WabiSabi/status' from origin 'http://localhost:8000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
    test: {
        public: {
            network: 'test',
            coordinatorName: 'CoinJoinCoordinatorIdentifier',
            coordinatorUrl: 'https://wasabiwallet.co/WabiSabi/', // (tor http://testwnp3fugjln6vh5vpj7mvq3lkqqwjj3c2aafyu7laxz42kgwh2rad.onion/WabiSabi/)
            // backend settings
            wabisabiBackendUrl: 'https://wasabiwallet.co/', // (tor http://testwnp3fugjln6vh5vpj7mvq3lkqqwjj3c2aafyu7laxz42kgwh2rad.onion/)
            blockbookUrls: ['https://tbtc1.trezor.io/api/v2', 'https://tbtc2.trezor.io/api/v2'],
            baseBlockHeight: 0,
            // baseBlockHash: '00000000000000018edfd007d07aea6ade16a117b2c0a5d57b3173c33e7ab807', // 2377432 (current)
            baseBlockHash: '0000000000006f5a1958de7f2ddd3157fb2f12a392b4e034e09d30da8151195c', // 2367432 (current - 50 tys, ~1 btc year) ~ 15 sec scan
            // baseBlockHash: '00000000000036741fb6820bd5eea02a6fa594c6f79d79cc2f64042e769626c9', // 2167432 (current - 250 tys) failed/freeze at 50%
            // baseBlockHash: '000000001eec9e483ddc3a9f2eea25b2639887def9ee2816c748b77248335c08', // 1746250 (all all 49'/1'/0' first tx)
            // baseBlockHash: '00000000000f0d5edcaeba823db17f366be49a80d91d15b77747c2e017b8c20a', // 828575 (wasabi prod) infinite scan :)
            // client settings
            middlewareUrl: 'http://localhost:8081/Cryptography/',
            // suite settings
            percentageFee: '0.03',
        },
    },
    regtest: {
        public: {
            network: 'regtest',
            coordinatorName: 'CoinJoinCoordinatorIdentifier',
            coordinatorUrl: 'https://dev-coinjoin.trezor.io/WabiSabi/',
            // backend settings
            wabisabiBackendUrl: 'https://dev-coinjoin.trezor.io/WabiSabi/',
            blockbookUrls: ['https://dev-coinjoin.trezor.io/blockbook/api/v2'],
            baseBlockHeight: 0,
            baseBlockHash: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
            // client settings
            middlewareUrl: 'https://dev-coinjoin.trezor.io/Cryptography/',
            // suite settings
            percentageFee: '0.03',
        },
        localhost: {
            network: 'regtest',
            coordinatorName: 'CoinJoinCoordinatorIdentifier',
            coordinatorUrl: 'http://localhost:8081/WabiSabi/',
            // backend settings
            wabisabiBackendUrl: 'http://localhost:8081/WabiSabi/',
            blockbookUrls: ['http://localhost:8081/blockbook/api/v2'],
            baseBlockHeight: 0,
            baseBlockHash: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
            // client settings
            middlewareUrl: 'http://localhost:8081/Cryptography/',
            // suite settings
            percentageFee: '0.03',
        },
    },
};

export const getCoinjoinConfig = (
    network: NetworkSymbol,
    environment?: CoinjoinServerEnvironment,
) => {
    const config = COINJOIN_NETWORKS[network];
    const settings = config ? config[environment ?? 'public'] : undefined;
    if (!settings)
        throw new Error(`Missing settings for coinjoin network ${network} env ${environment}`);

    return settings;
};
