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
            percentageFee: '0.3',
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
            percentageFee: '0.3',
        },
    },
};

// coinjoin strategy constants
export const ESTIMATED_ANONYMITY_GAINED_PER_ROUND = 10;
export const ESTIMATED_HOURS_PER_ROUND_WITHOUT_SKIPPING_ROUNDS = 1;
export const ESTIMATED_HOURS_PER_ROUND_WITH_SKIPPING_ROUNDS = 2.5;
export const ESTIMATED_HOURS_BUFFER_MODIFIER = 0.25;
export const RECOMMENDED_SKIP_ROUNDS = [4, 5] as [number, number];
export const DEFAULT_MAX_MINING_FEE = 3;

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
