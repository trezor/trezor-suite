// import { MyDBV1, STORE_WALLET_SETTINGS, STORE_SUITE_SETTINGS } from '../../types/index';
// import { getDB, notify } from '../../index';

// export const saveWalletSettings = async (settings: MyDBV1['settings']['value']) => {
//     const db = await getDB();
//     const tx = db.transaction(STORE_WALLET_SETTINGS, 'readwrite');
//     // shortcut db.add throws null instead of ConstraintError on duplicate key (???)
//     const result = await tx.store.put(settings, 'wallet');
//     notify(STORE_WALLET_SETTINGS, [result]);
//     return result;
// };

// export const getWalletSettings = async () => {
//     const db = await getDB();
//     const tx = db.transaction(STORE_WALLET_SETTINGS);
//     const settings = await tx.store.get('wallet');
//     return settings;
// };

// export const saveSuiteSettings = async (settings: MyDBV1['settings']['value']) => {
//     const db = await getDB();
//     const tx = db.transaction(STORE_SUITE_SETTINGS, 'readwrite');
//     // shortcut db.add throws null instead of ConstraintError on duplicate key (???)
//     const result = await tx.store.put(settings, 'suite');
//     notify(STORE_SUITE_SETTINGS, [result]);
//     return result;
// };

// export const getSuiteSettings = async () => {
//     const db = await getDB();
//     const tx = db.transaction(STORE_SUITE_SETTINGS);
//     const settings = await tx.store.get('suite');
//     return settings;
// };
