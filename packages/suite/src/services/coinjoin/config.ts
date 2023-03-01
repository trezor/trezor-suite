import {
    PLEBS_DONT_PAY_THRESHOLD_FALLBACK,
    COORDINATOR_FEE_RATE_FALLBACK,
    MIN_ALLOWED_AMOUNT_FALLBACK,
    MAX_ALLOWED_AMOUNT_FALLBACK,
    MAX_MINING_FEE_FALLBACK,
} from '@trezor/coinjoin/src/constants';
import type { CoinjoinBackendSettings, CoinjoinClientSettings } from '@trezor/coinjoin';
import type { PartialRecord } from '@trezor/type-utils';
import type { CoinjoinServerEnvironment } from '@wallet-types/coinjoin';
import type { NetworkSymbol } from '@suite-common/wallet-config';

type CoinjoinNetworksConfig = CoinjoinBackendSettings & CoinjoinClientSettings;

type ServerEnvironment = PartialRecord<CoinjoinServerEnvironment, CoinjoinNetworksConfig>;

export const COINJOIN_NETWORKS: PartialRecord<NetworkSymbol, ServerEnvironment> = {
    btc: {
        public: {
            network: 'btc',
            coordinatorName: 'CoinJoinCoordinatorIdentifier',
            coordinatorUrl: 'https://wasabiwallet.io/wabisabi/',
            wabisabiBackendUrl: 'https://wasabiwallet.io/',
            blockbookUrls: [
                'https://btc1.trezor.io/api/v2',
                'https://btc2.trezor.io/api/v2',
                'https://btc3.trezor.io/api/v2',
                'https://btc4.trezor.io/api/v2',
                'https://btc5.trezor.io/api/v2',
            ],
            /* 28.02.2023 */
            baseBlockHeight: 778666,
            baseBlockHash: '000000000000000000054d1ca4a160dd37541d776ccc34af955dbfcd3b2405f6',
            // TODO post MVP: unify filters batch size with wabisabi or implement filters on blockbooks
            // https://github.com/trezor/trezor-suite/issues/7182#issuecomment-1438182493
            filtersBatchSize: 500,
            middlewareUrl: 'http://localhost:8081/',
        },
    },
    /*
     * btc: https://wasabiwallet.io/ (tor http://wasabiukrxmkdgve5kynjztuovbg43uxcbcxn6y2okcrsg7gb6jdmbad.onion/)
     * available only in @suite-desktop
     * browser throws: Access to XMLHttpRequest at 'https://wasabiwallet.co/WabiSabi/status' from origin 'http://localhost:8000'
     * has been blocked by CORS policy: Response to preflight request doesn't pass access control check:
     * No 'Access-Control-Allow-Origin' header is present on the requested resource.
     */
    test: {
        public: {
            network: 'test',
            coordinatorName: 'CoinJoinCoordinatorIdentifier',
            /* clearnet addresses */
            coordinatorUrl: 'https://wasabiwallet.co/wabisabi/',
            // backend settings
            wabisabiBackendUrl: 'https://wasabiwallet.co/',
            blockbookUrls: ['https://tbtc1.trezor.io/api/v2', 'https://tbtc2.trezor.io/api/v2'],
            /* */
            /* onion addresses *
            coordinatorUrl:
                'http://dev-coinjoin-testnet.trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion/WabiSabi/',
            // backend settings
            wabisabiBackendUrl:
                'http://dev-coinjoin-testnet.trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion/',
            blockbookUrls: [
                'http://tbtc1.trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion/api/v2',
                'http://tbtc2.trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion/api/v2',
            ],
            /* */
            /* wasabi production *
            baseBlockHeight: 828575,
            baseBlockHash: '00000000000f0d5edcaeba823db17f366be49a80d91d15b77747c2e017b8c20a',
            /* */
            /* 50 tys, ~1 btc year *
            baseBlockHeight: 2367432,
            baseBlockHash: '0000000000006f5a1958de7f2ddd3157fb2f12a392b4e034e09d30da8151195c',
            /* */
            /* all all 49'/1'/0' first tx *
            baseBlockHeight: 1746250,
            baseBlockHash: '000000001eec9e483ddc3a9f2eea25b2639887def9ee2816c748b77248335c08',
            /*  */
            /* first block for vpub5Yme8cvVDuECgS5vuY8rYyVMrnSvDaUwbDeKLNhh3BKZYe3fpKKapVQUFAEVpyBbwaUhZLeZLcwcoRMweSfRtFxB6MenWh3NweXrQ3CTZM9 *
            baseBlockHeight: 1821033,
            baseBlockHash: '00000000000bb983f68a7bcff154f229f777ff0802788ae26424af9c15db3959',
            /* */
            /* October 1st, 2022  */
            baseBlockHeight: 2349000,
            baseBlockHash: '0000000000000014af3e6e1a3f0a24be7bc65998b9bc01e4a05b134a89d304bf',
            /* */
            filtersBatchSize: 5000,
            // client settings
            middlewareUrl: 'http://localhost:8081/',
        },
        staging: {
            network: 'test',
            coordinatorName: 'CoinJoinCoordinatorIdentifier',
            coordinatorUrl: 'https://dev-coinjoin-testnet.trezor.io/wabisabi/',
            // backend settings
            wabisabiBackendUrl: 'https://dev-coinjoin-testnet.trezor.io/',
            blockbookUrls: ['https://tbtc1.trezor.io/api/v2', 'https://tbtc2.trezor.io/api/v2'],
            baseBlockHeight: 2349000,
            baseBlockHash: '0000000000000014af3e6e1a3f0a24be7bc65998b9bc01e4a05b134a89d304bf',
            filtersBatchSize: 5000,
            // client settings
            middlewareUrl: 'http://localhost:8081/',
        },
    },
    regtest: {
        public: {
            network: 'regtest',
            coordinatorName: 'CoinJoinCoordinatorIdentifier',
            coordinatorUrl: 'https://dev-coinjoin.trezor.io/backend/wabisabi/',
            // backend settings
            wabisabiBackendUrl: 'https://dev-coinjoin.trezor.io/backend/',
            blockbookUrls: ['https://dev-coinjoin.trezor.io/blockbook/api/v2'],
            baseBlockHeight: 0,
            baseBlockHash: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
            filtersBatchSize: 5000,
            // client settings
            middlewareUrl: 'https://dev-coinjoin.trezor.io/client/',
        },
        localhost: {
            network: 'regtest',
            coordinatorName: 'CoinJoinCoordinatorIdentifier',
            coordinatorUrl: 'http://localhost:8081/backend/wabisabi/',
            // backend settings
            wabisabiBackendUrl: 'http://localhost:8081/backend/',
            blockbookUrls: ['http://localhost:8081/blockbook/api/v2'],
            baseBlockHeight: 0,
            baseBlockHash: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
            filtersBatchSize: 5000,
            // client settings
            middlewareUrl: 'http://localhost:8081/client/',
        },
    },
};

// coinjoin strategy constants
export const ESTIMATED_ANONYMITY_GAINED_PER_ROUND = 10; // initial value replaced by config via message-system in state.wallet.coinjoin.config.averageAnonymityGainPerRound
export const MIN_ANONYMITY_GAINED_PER_ROUND = 0.1; // the minimum anonymity gain per coinjoin round that is used to avoid division by zero when computing roundsNeeded.
export const ESTIMATED_ROUNDS_FAIL_RATE_BUFFER = 2.5;
export const ESTIMATED_MIN_ROUNDS_NEEDED = 4;
export const ESTIMATED_HOURS_PER_ROUND = 1;
export const RECOMMENDED_SKIP_ROUNDS = undefined; // temporary disabled for testing purposes // [4, 5] as [number, number];
export const DEFAULT_MAX_MINING_FEE = 3;
export const CLIENT_STATUS_FALLBACK = {
    rounds: [],
    maxMiningFee: MAX_MINING_FEE_FALLBACK,
    coordinationFeeRate: {
        rate: COORDINATOR_FEE_RATE_FALLBACK,
        plebsDontPayThreshold: PLEBS_DONT_PAY_THRESHOLD_FALLBACK,
    },
    allowedInputAmounts: {
        min: MIN_ALLOWED_AMOUNT_FALLBACK,
        max: MAX_ALLOWED_AMOUNT_FALLBACK,
    },
};

// coordinator fee rate from status format (0.003)
// firmware format (300 000 = 0.003 * 10 ** 8)
export const COORDINATOR_FEE_RATE_MULTIPLIER = 10 ** 8;

export const DEFAULT_TARGET_ANONYMITY = 10;

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
