import { db } from '@suite/storage';

// This function should be called before first render
// PreloadedState will be used in redux store creation
export const preloadStore = async () => {
    if (!(await db.isSupported())) return;

    // check if db is blocked/blocking before preloading start
    // TODO-NOTE: maybe it should return { suite: { dbError: '' }} instead?
    await new Promise<void>((resolve, reject) => {
        // set callbacks that are fired when upgrading the db is blocked because of multiple instances are running
        db.onBlocked = () => reject(new Error('blocked'));
        db.onBlocking = () => reject(new Error('blocking'));
        // initialize
        db.getDB().then(() => resolve());
    });

    // load state from database
    const suiteSettings = await db.getItemByPK('suiteSettings', 'suite');
    const devices = await db.getItemsExtended('devices');
    const accounts = await db.getItemsExtended('accounts');
    const discovery = await db.getItemsExtended('discovery');
    const walletSettings = await db.getItemByPK('walletSettings', 'wallet');
    const fiatRates = await db.getItemsExtended('fiatRates');
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

    return {
        suiteSettings,
        walletSettings,
        devices,
        accounts,
        discovery,
        txs,
        fiatRates,
        graph,
        coinmarketTrades,
        sendFormDrafts,
        formDrafts,
        analytics,
        metadata,
        messageSystem,
        backendSettings,
        firmware,
    };
};

export type PreloadedStore = Awaited<ReturnType<typeof preloadStore>>;
