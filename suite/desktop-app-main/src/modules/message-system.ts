/**
 * Message system owner.
 *
 * On desktop the main process is the acquisition point of the message system config: it loads the
 * persisted config, polls for a newer one, verifies its authenticity and from it computes the
 * gate - whether the surfaces main serves on its own (bridge, `/connect-ws`, http-receiver) may
 * run at all. A `--bridge-daemon` or auto-started boot may never create a renderer, so a
 * killswitch evaluated in the renderer could not reach any of those surfaces.
 */
import {
    type MessageSystemPlatform,
    compareConfigSequence,
    createConfigPoller,
    fetchRemoteConfigJws,
    getKillswitchMessage,
    getRemoteConfigUrl,
    getValidMessages,
    isConfigFetchDue,
    toFactIndependentConfig,
    verifyConfigJws,
} from '@suite-common/message-system-core';
import { type MessageSystem } from '@suite-common/suite-types';
import { getCommitHash, getEnvironment, getSuiteVersion, isCodesignBuild } from '@trezor/env-utils';

import type { ILogger } from '../libs/logger';
import { hasSwitch } from '../libs/process-switches';
import type { Store } from '../libs/store';

export const SERVICE_NAME = 'message-system';

export type MessageSystemGate = {
    /** The build is killswitched, so main must serve nothing until a config says otherwise. */
    isKillswitchActive: boolean;
    killswitchMessageId: string | undefined;
};

type GateListener = (gate: MessageSystemGate) => void;

/** @serviceContract */
export type MessageSystemOwner = {
    /** Applies the persisted config, without touching the network. */
    loadPersistedConfig: () => void;
    /** Fetches, verifies and applies a remote config when one is due. */
    acquireRemoteConfig: () => Promise<void>;
    startPolling: () => Promise<void>;
    stopPolling: () => void;
    getGate: () => MessageSystemGate;
    subscribe: (listener: GateListener) => () => void;
};

type MessageSystemOwnerDependencies = {
    store: Store;
    logger: ILogger;
    /**
     * `global.fetch` in main is Tor-aware and whitelist-checked only once `createInterceptor()`
     * ran, so a config fetch before that point would be a plain clearnet request made from a Tor
     * user's machine. The acquisition refuses to run until this reports the interceptor installed.
     */
    isInterceptorInstalled: () => boolean;
    /**
     * Reports `false` while Tor is wanted but not up yet. `interceptFetch` proxies a request only
     * once Tor is running, so a fetch made in the meantime would leave over clearnet. The
     * acquisition then keeps the config it has and tries again on the next poll.
     */
    isTorReady: () => boolean;
};

const INACTIVE_GATE: MessageSystemGate = {
    isKillswitchActive: false,
    killswitchMessageId: undefined,
};

// `getOsName()` from env-utils reads `window.navigator` to tell the mobile platforms apart, which
// throws in the main process, so the desktop platforms are mapped here instead.
const getOsName = () => {
    switch (process.platform) {
        case 'win32':
            return 'windows';
        case 'darwin':
            return 'macos';
        default:
            return 'linux';
    }
};

const getPlatform = (): MessageSystemPlatform => ({
    suiteEnvironment: getEnvironment(),
    suiteVersion: getSuiteVersion(),
    commitHash: getCommitHash(),
    osName: getOsName(),
    // The os and browser facts are not part of a fact-independent condition, so main does not need
    // the client hints that the renderer reads the os version from.
    osVersion: undefined,
    browserName: '',
    browserVersion: '',
});

const evaluateGate = (config: MessageSystem): MessageSystemGate => {
    const killswitchMessage = getKillswitchMessage(
        getValidMessages(toFactIndependentConfig(config), {
            platform: getPlatform(),
            // Settings and country code conditions are dropped by `toFactIndependentConfig`, so
            // nothing left to evaluate can read these.
            settings: { tor: false, enabledNetworks: [] },
            countryCode: null,
        }),
    );

    return {
        isKillswitchActive: killswitchMessage !== undefined,
        killswitchMessageId: killswitchMessage?.id,
    };
};

export const createMessageSystemOwner = ({
    store,
    logger,
    isInterceptorInstalled,
    isTorReady,
}: MessageSystemOwnerDependencies): MessageSystemOwner => {
    const poller = createConfigPoller({ isMobile: false });
    const listeners = new Set<GateListener>();
    let gate = INACTIVE_GATE;
    // In memory on purpose: a persisted fetch timestamp would make a relaunch within the fetch
    // interval skip the startup fetch and run on a stale config, which the renderer never did.
    let lastFetchTimestamp = 0;
    // The rollback floor, taken only from a config that verified. The persisted sequence must not
    // be used for it: the store file is user-writable, so a sequence no verified config backs
    // would make every future config look like a rollback and reject it forever.
    let appliedSequence = 0;

    const applyConfig = (config: MessageSystem) => {
        const nextGate = evaluateGate(config);
        if (
            nextGate.isKillswitchActive === gate.isKillswitchActive &&
            nextGate.killswitchMessageId === gate.killswitchMessageId
        ) {
            return;
        }

        gate = nextGate;
        logger.info(
            SERVICE_NAME,
            gate.isKillswitchActive
                ? `Killswitch is active (${gate.killswitchMessageId})`
                : 'Killswitch is not active',
        );
        listeners.forEach(listener => listener(gate));
    };

    const loadPersistedConfig = () => {
        const cache = store.getMessageSystemCache();
        if (typeof cache?.configJws !== 'string') {
            return;
        }

        try {
            // The persisted JWS is verified again on every launch: the store file is user-writable,
            // so its content is trusted no more than a freshly downloaded one.
            const config = verifyConfigJws(cache.configJws);
            appliedSequence = config.sequence;
            applyConfig(config);
        } catch (error) {
            // A cache that does not verify is worth nothing, including its sequence, so it is
            // dropped rather than kept as the rollback floor of every future config.
            logger.error(SERVICE_NAME, `Persisted config is not usable: ${error.message}`);
            store.clearMessageSystemCache();
        }
    };

    const acquireRemoteConfig = async () => {
        if (hasSwitch('offline-mode') || process.env.PLAYWRIGHT_RUN) {
            return;
        }

        if (!isInterceptorInstalled()) {
            logger.error(
                SERVICE_NAME,
                'Refusing to fetch the config before the request interceptor is installed',
            );

            return;
        }

        if (!isTorReady()) {
            logger.info(SERVICE_NAME, 'Postponing the config fetch until Tor is running');

            return;
        }

        const cache = store.getMessageSystemCache();
        if (!isConfigFetchDue({ isLocalConfig: false, lastFetchTimestamp, isMobile: false })) {
            return;
        }

        try {
            const configJws = await fetchRemoteConfigJws(getRemoteConfigUrl(isCodesignBuild()));
            const config = verifyConfigJws(configJws);

            if (compareConfigSequence(appliedSequence, config.sequence) === 'older') {
                throw Error(
                    `Sequence of config (${config.sequence}) is older than the current one (${appliedSequence}).`,
                );
            }

            if (configJws !== cache?.configJws) {
                // `conf` re-serialises the whole store and writes it synchronously, and the JWS
                // alone is ~150 kB, so the unchanged config a poll normally returns must not
                // write. Only a config that actually changed is persisted.
                store.setMessageSystemCache({ configJws, sequence: config.sequence });
            }
            lastFetchTimestamp = Date.now();
            appliedSequence = config.sequence;
            applyConfig(config);
        } catch (error) {
            logger.error(SERVICE_NAME, `Acquiring of the remote config failed: ${error.message}`);
        }
    };

    return {
        loadPersistedConfig,
        acquireRemoteConfig,
        startPolling: () => poller.start(acquireRemoteConfig),
        stopPolling: () => poller.stop(),
        getGate: () => gate,
        subscribe: listener => {
            listeners.add(listener);

            return () => {
                listeners.delete(listener);
            };
        },
    };
};
