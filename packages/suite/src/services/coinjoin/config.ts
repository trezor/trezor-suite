import {
    PLEBS_DONT_PAY_THRESHOLD_FALLBACK,
    COORDINATOR_FEE_RATE_FALLBACK,
    MIN_ALLOWED_AMOUNT_FALLBACK,
    MAX_ALLOWED_AMOUNT_FALLBACK,
} from '@trezor/coinjoin/src/constants';
import type { CoinjoinBackendSettings, CoinjoinClientSettings } from '@trezor/coinjoin';
import type { PartialRecord } from '@trezor/type-utils';
import type { CoinjoinServerEnvironment } from 'src/types/wallet/coinjoin';
import type { NetworkSymbol } from '@suite-common/wallet-config';

type CoinjoinNetworksConfig = CoinjoinBackendSettings & CoinjoinClientSettings;

type ServerEnvironment = PartialRecord<CoinjoinServerEnvironment, CoinjoinNetworksConfig>;

export const COINJOIN_NETWORKS: PartialRecord<NetworkSymbol, ServerEnvironment> = {
    btc: {
        /* default, see getCoinjoinConfig */
        public: {
            network: 'btc',
            coordinatorName: 'CoinJoinCoordinatorIdentifier',
            coordinatorUrl: 'https://wasabiwallet.io/wabisabi/',
            wabisabiBackendUrl: 'https://wasabiwallet.io/',
            blockbookUrls: [
                'https://btc1.trezor.io',
                'https://btc2.trezor.io',
                'https://btc3.trezor.io',
                'https://btc4.trezor.io',
                'https://btc5.trezor.io',
            ],
            onionDomains: {
                'trezor.io': 'trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion',
                'wasabiwallet.io': 'wasabiukrxmkdgve5kynjztuovbg43uxcbcxn6y2okcrsg7gb6jdmbad.onion',
            },
            /* 28.02.2023 */
            baseBlockHeight: 778666,
            baseBlockHash: '000000000000000000054d1ca4a160dd37541d776ccc34af955dbfcd3b2405f6',
            // TODO post MVP: unify filters batch size with wabisabi or implement filters on blockbooks
            // https://github.com/trezor/trezor-suite/issues/7182#issuecomment-1438182493
            filtersBatchSize: 500,
            middlewareUrl: 'http://127.0.0.1:8081/',
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
        /* default, see getCoinjoinConfig */
        public: {
            network: 'test',
            coordinatorName: 'CoinJoinCoordinatorIdentifier',
            /* clearnet addresses */
            coordinatorUrl: 'https://wasabiwallet.co/wabisabi/',
            // backend settings
            wabisabiBackendUrl: 'https://wasabiwallet.co/',
            blockbookUrls: ['https://tbtc1.trezor.io', 'https://tbtc2.trezor.io'],
            onionDomains: {
                'trezor.io': 'trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion',
                'wasabiwallet.co': 'testwnp3fugjln6vh5vpj7mvq3lkqqwjj3c2aafyu7laxz42kgwh2rad.onion',
            },
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
            middlewareUrl: 'http://127.0.0.1:8081/',
        },
        staging: {
            network: 'test',
            coordinatorName: 'CoinJoinCoordinatorIdentifier',
            coordinatorUrl: 'https://dev-coinjoin-testnet.trezor.io/wabisabi/',
            // backend settings
            wabisabiBackendUrl: 'https://dev-coinjoin-testnet.trezor.io/',
            blockbookUrls: ['https://tbtc1.trezor.io', 'https://tbtc2.trezor.io'],
            baseBlockHeight: 2349000,
            baseBlockHash: '0000000000000014af3e6e1a3f0a24be7bc65998b9bc01e4a05b134a89d304bf',
            filtersBatchSize: 5000,
            // client settings
            middlewareUrl: 'http://127.0.0.1:8081/',
        },
    },
    regtest: {
        /* default, see getCoinjoinConfig */
        localhost: {
            network: 'regtest',
            coordinatorName: 'CoinJoinCoordinatorIdentifier',
            coordinatorUrl: 'http://127.0.0.1:8081/backend/wabisabi/',
            // backend settings
            wabisabiBackendUrl: 'http://127.0.0.1:8081/backend/',
            blockbookUrls: ['http://127.0.0.1:19121'],
            baseBlockHeight: 0,
            baseBlockHash: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
            filtersBatchSize: 5000,
            // client settings
            middlewareUrl: 'http://127.0.0.1:8081/client/',
        },
    },
};

export const ESTIMATED_ANONYMITY_GAINED_PER_ROUND = 10; // initial value replaced by config via message-system in state.wallet.coinjoin.config.averageAnonymityGainPerRound
export const MIN_ANONYMITY_GAINED_PER_ROUND = 0.1; // the minimum anonymity gain per coinjoin round that is used to avoid division by zero when computing roundsNeeded.
export const ESTIMATED_ROUNDS_FAIL_RATE_BUFFER = 2.5;
export const MAX_ROUNDS_ALLOWED = 500; // Never ask trezor to sign more than 500 rounds, it will fail if safety checks are enabled.
export const ESTIMATED_MIN_ROUNDS_NEEDED = 4;
export const ESTIMATED_HOURS_PER_ROUND = 1;
export const UNECONOMICAL_COINJOIN_THRESHOLD = 1_000_000;
export const COORDINATOR_FEE_RATE_MULTIPLIER = 10 ** 8; // coordinator fee rate from status format (0.003) - firmware format (300 000 = 0.003 * 10 ** 8)
export const DEFAULT_TARGET_ANONYMITY = 5;
export const SKIP_ROUNDS_BY_DEFAULT = false;
export const SKIP_ROUNDS_VALUE_WHEN_ENABLED = [4, 5] as [number, number];
export const FEE_RATE_MEDIAN_FALLBACK = 2;
export const MAX_MINING_FEE_MODIFIER = 2.5; // modifier applied to a median fee rate to set default max mining fee rate per vbyte
export const CLIENT_STATUS_FALLBACK = {
    rounds: [],
    feeRateMedian: FEE_RATE_MEDIAN_FALLBACK,
    coordinationFeeRate: {
        rate: COORDINATOR_FEE_RATE_FALLBACK,
        plebsDontPayThreshold: PLEBS_DONT_PAY_THRESHOLD_FALLBACK,
    },
    allowedInputAmounts: {
        min: MIN_ALLOWED_AMOUNT_FALLBACK,
        max: MAX_ALLOWED_AMOUNT_FALLBACK,
    },
};
export const ZKSNACKS_LEGAL_DOCUMENTS_VERSION = '1.0';
export const TREZOR_LEGAL_DOCUMENTS_VERSION = '1.0';

// Estimating anonymity gain per round:
// How many previous coinjoin transactions are taken into account
export const ANONYMITY_GAINS_HINDSIGHT_COUNT = 10;
// What are the oldest coinjoin transactions taken into account
export const ANONYMITY_GAINS_HINDSIGHT_DAYS = 30;

export const getCoinjoinConfig = (
    network: NetworkSymbol,
    environment?: CoinjoinServerEnvironment,
) => {
    const config = COINJOIN_NETWORKS[network];
    const settings = config
        ? config[environment ?? (Object.keys(config)[0] as CoinjoinServerEnvironment)]
        : undefined;
    if (!settings)
        throw new Error(`Missing settings for coinjoin network ${network} env ${environment}`);

    return settings;
};
