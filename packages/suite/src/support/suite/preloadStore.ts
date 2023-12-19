import { db } from 'src/storage';
import * as STORAGE from 'src/actions/suite/constants/storageConstants';

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
        db.getDB().then(() => resolve(undefined));
    });

    if (dbError) {
        return {
            type: STORAGE.ERROR,
            payload: dbError,
        } as const;
    }

    // load state from database
    const suiteSettings = await db.getItemByPK('suiteSettings', 'suite');
    const devices = await db.getItemsExtended('devices');
    const accounts = await db.getItemsExtended('accounts');
    const discovery = await db.getItemsExtended('discovery');
    const walletSettings = await db.getItemByPK('walletSettings', 'wallet');
    const coinmarketTrades = await db.getItemsExtended('coinmarketTrades');
    const graph = await db.getItemsExtended('graph');
    const analytics = await db.getItemByPK('analytics', 'suite');
    const metadata = await db.getItemByPK('metadata', 'state');
    const txs = await db.getItemsExtended('txs', 'order');
    const messageSystem = await db.getItemByPK('messageSystem', 'suite');
    const backendSettings = await db.getItemsWithKeys('backendSettings');
    const sendFormDrafts = await db.getItemsWithKeys('sendFormDrafts');
    const formDrafts = await db.getItemsWithKeys('formDrafts');
    const firmware = await db.getItemByPK('firmware', 'firmware');
    const coinjoinAccounts = await db.getItemsExtended('coinjoinAccounts');
    const coinjoinDebugSettings = await db.getItemByPK('coinjoinDebugSettings', 'debug');

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
            coinmarketTrades,
            sendFormDrafts,
            formDrafts,
            analytics,
            metadata,
            messageSystem,
            backendSettings,
            firmware,
            coinjoinAccounts,
            coinjoinDebugSettings,
        },
    } as const;
};

export type PreloadStoreAction = Awaited<ReturnType<typeof preloadStore>>;
