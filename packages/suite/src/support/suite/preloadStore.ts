import { getSupportedNetworks } from '@suite-common/wallet-config';

import * as STORAGE from 'src/actions/suite/constants/storageConstants';
import { db } from 'src/storage';

// Load persisted state before rendering the Redux-connected app. The store is created
// synchronously during composition and hydrated with this result during initialization.
export const preloadStore = async () => {
    if (!db.isSupported()) return;

    try {
        const { onBlocked, onBlocking } = db;
        const dbError = await new Promise<'blocked' | 'blocking' | undefined>((resolve, reject) => {
            db.onBlocked = () => resolve('blocked');
            db.onBlocking = () => resolve('blocking');
            // Opening can fail without a blocked event (e.g. an Electron profile lock).
            // Let the storage-error handling below settle startup instead of leaving the loader hanging.
            db.getDB().then(() => resolve(undefined), reject);
        }).finally(() => {
            // Store creation now precedes preloading, so restore the middleware's lifecycle handlers.
            db.onBlocked = onBlocked;
            db.onBlocking = onBlocking;
        });

        if (dbError) {
            return {
                type: STORAGE.ERROR,
                payload: dbError,
            } as const;
        }

        // Load state from database in parallel using Promise.all
        const [
            suiteSettings,
            devices,
            thp,
            bluetooth,
            accounts,
            walletSettings,
            tradingTrades,
            historicRates,
            graph,
            analytics,
            metadata,
            txs,
            phishing,
            phishingMetadata,
            messageSystem,
            backendSettings,
            sendFormDrafts,
            receive,
            formDrafts,
            coinjoinAccounts,
            coinjoinDebugSettings,
            tokenManagement,
            persistentDeviceData,
            connect,
            explorer,
            bioAuth,
            firmware,
            suiteSyncSettings,
            suiteSyncOwners,
            suiteSyncQuotaManager,
            featureFeedback,
            discreetMode,
            debug,
            earnOnboarding,
        ] = await Promise.all([
            db.getItemByPK('suiteSettings', 'suite'),
            db.getItemsExtended('devices'),
            db.getItemByPK('thp', 'value'),
            db.getItemByPK('bluetooth', 'value'),
            db.getItemsExtended('accounts'),
            db.getItemByPK('walletSettings', 'wallet'),
            db.getItemsExtended('tradingTrades'),
            db.getItemsWithKeys('historicRates'),
            db.getItemsExtended('graph'),
            db.getItemByPK('analytics', 'suite'),
            db.getItemByPK('metadata', 'state'),
            db.getItemsExtended('txs', 'order'),
            db.getItemsWithKeys('phishing'),
            db.getItemByPK('phishingMetadata', 'phishingMetadata'),
            db.getItemByPK('messageSystem', 'suite'),
            db.getItemsWithKeys('backendSettings'),
            db.getItemsWithKeys('sendFormDrafts'),
            db.getItemsWithKeys('receive'),
            db.getItemsWithKeys('formDrafts'),
            db.getItemsExtended('coinjoinAccounts'),
            db.getItemByPK('coinjoinDebugSettings', 'debug'),
            db.getItemsWithKeys('tokenManagement'),
            db.getItemByPK('persistentDeviceData', 'persistentDeviceData'),
            db.getItemByPK('connect', 'connect'),
            db.getItemsExtended('explorer'),
            db.getItemByPK('bioAuth', 'bioAuth'),
            db.getItemByPK('firmware', 'firmware'),
            db.getItemByPK('suiteSyncSettings', 'suiteSyncSettings'),
            db.getItemsWithKeys('suiteSyncOwners'),
            db.getItemByPK('suiteSyncQuotaManager', 'suiteSyncQuotaManager'),
            db.getItemByPK('featureFeedback', 'featureFeedback'),
            db.getItemByPK('discreetMode', 'discreetMode'),
            db.getItemByPK('debug', 'debug'),
            db.getItemsWithKeys('earnOnboarding'),
        ]);

        return {
            type: STORAGE.LOAD,
            payload: {
                // Hydration runs before network metadata is loaded into Redux.
                // TODO(#30572): Supply migration ordering without the legacy registry.
                supportedNetworks: getSupportedNetworks(),
                suiteSettings,
                walletSettings,
                devices,
                thp,
                bluetooth,
                accounts,
                txs,
                phishing,
                phishingMetadata,
                graph,
                tradingTrades,
                historicRates,
                sendFormDrafts,
                receive,
                formDrafts,
                analytics,
                metadata,
                messageSystem,
                backendSettings,
                coinjoinAccounts,
                coinjoinDebugSettings,
                tokenManagement,
                persistentDeviceData,
                bioAuth,
                connect,
                explorer,
                firmware,
                suiteSyncSettings,
                suiteSyncOwners,
                suiteSyncQuotaManager,
                featureFeedback,
                discreetMode,
                debug,
                earnOnboarding,
            },
        } as const;
    } catch (error) {
        console.error(error); // Report the error to sentry instead of silently failing

        return {
            type: STORAGE.CORRUPTED,
            payload: error.message,
        } as const;
    }
};

export type PreloadStoreAction = Awaited<ReturnType<typeof preloadStore>>;
