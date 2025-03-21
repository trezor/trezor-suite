import * as STORAGE from 'src/actions/suite/constants/storageConstants';
import { db } from 'src/storage';

// This function should be called before first render
// PreloadedState will be used in redux store creation
export const preloadStore = async () => {
    if (!(await db.isSupported())) return;

    // check if db is blocked/blocking before preloading start
    const dbError = await new Promise<'blocked' | 'blocking' | undefined>(resolve => {
        // set callbacks that are fired when upgrading the db is blocked because of multiple instances are running
        db.onBlocked = () => resolve('blocked');
        db.onBlocking = () => resolve('blocking');
        // initialize
        db.getDB()
            .then(() => resolve(undefined))
            .catch(() => {}); // So there isn't unhandled rejection
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
        accounts,
        discovery,
        walletSettings,
        tradingTrades,
        historicRates,
        graph,
        analytics,
        metadata,
        txs,
        messageSystem,
        backendSettings,
        sendFormDrafts,
        formDrafts,
        coinjoinAccounts,
        coinjoinDebugSettings,
        tokenManagement,
        security,
    ] = await Promise.all([
        db.getItemByPK('suiteSettings', 'suite'),
        db.getItemsExtended('devices'),
        db.getItemsExtended('accounts'),
        db.getItemsExtended('discovery'),
        db.getItemByPK('walletSettings', 'wallet'),
        db.getItemsExtended('tradingTrades'),
        db.getItemsWithKeys('historicRates'),
        db.getItemsExtended('graph'),
        db.getItemByPK('analytics', 'suite'),
        db.getItemByPK('metadata', 'state'),
        db.getItemsExtended('txs', 'order'),
        db.getItemByPK('messageSystem', 'suite'),
        db.getItemsWithKeys('backendSettings'),
        db.getItemsWithKeys('sendFormDrafts'),
        db.getItemsWithKeys('formDrafts'),
        db.getItemsExtended('coinjoinAccounts'),
        db.getItemByPK('coinjoinDebugSettings', 'debug'),
        db.getItemsWithKeys('tokenManagement'),
        db.getItemByPK('security', 'security'),
    ]);

    return {
        type: STORAGE.LOAD,
        payload: {
            suiteSettings,
            walletSettings,
            devices,
            accounts,
            discovery,
            txs,
            graph,
            tradingTrades,
            historicRates,
            sendFormDrafts,
            formDrafts,
            analytics,
            metadata,
            messageSystem,
            backendSettings,
            coinjoinAccounts,
            coinjoinDebugSettings,
            tokenManagement,
            security,
        },
    } as const;
};

export type PreloadStoreAction = Awaited<ReturnType<typeof preloadStore>>;
